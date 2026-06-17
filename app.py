from flask import Flask, jsonify, render_template, request
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re
import os

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        xml_content = response.text
    except Exception as e:
        print(f"Error fetching feed: {e}")
        # Return fallback or raise
        raise

    root = ET.fromstring(xml_content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    parsed_items = []
    
    for entry in root.findall('atom:entry', ns):
        title_elem = entry.find('atom:title', ns)
        date_str = title_elem.text if title_elem is not None else "Unknown Date"
        
        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text if id_elem is not None else ""
        
        # Extract link
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        if link_elem is None:
            link_elem = entry.find('atom:link', ns)
        link_href = link_elem.attrib.get('href', '') if link_elem is not None else ''
        
        content_elem = entry.find('atom:content', ns)
        if content_elem is None or not content_elem.text:
            continue
            
        content_html = content_elem.text
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_type = "Update"
        current_elements = []
        
        for child in soup.contents:
            if child.name == 'h3':
                if current_elements:
                    content_str = "".join(str(el) for el in current_elements).strip()
                    if content_str:
                        # Clean up formatting/extra spaces
                        content_str = re.sub(r'\s+', ' ', content_str)
                        parsed_items.append({
                            "id": f"{entry_id}#{current_type.lower()}_{len(parsed_items)}",
                            "date": date_str,
                            "type": current_type,
                            "content": content_str,
                            "link": link_href
                        })
                    current_elements = []
                current_type = child.get_text().strip()
            else:
                current_elements.append(child)
                
        if current_elements:
            content_str = "".join(str(el) for el in current_elements).strip()
            if content_str:
                content_str = re.sub(r'\s+', ' ', content_str)
                parsed_items.append({
                    "id": f"{entry_id}#{current_type.lower()}_{len(parsed_items)}",
                    "date": date_str,
                    "type": current_type,
                    "content": content_str,
                    "link": link_href
                })
                
    return parsed_items

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        items = fetch_and_parse_feed()
        return jsonify({
            "success": True,
            "data": items
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Flask development server
    app.run(debug=True, host='127.0.0.1', port=5000)

import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template
from bs4 import BeautifulSoup

app = Flask(__name__)

# Add a route to serve the main index file
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityFeedReader/1.0'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry_el in root.findall('atom:entry', ns):
            title_el = entry_el.find('atom:title', ns)
            id_el = entry_el.find('atom:id', ns)
            updated_el = entry_el.find('atom:updated', ns)
            link_el = entry_el.find('atom:link[@rel="alternate"]', ns)
            if link_el is None:
                link_el = entry_el.find('atom:link', ns)
            content_el = entry_el.find('atom:content', ns)
            
            title = title_el.text if title_el is not None else ""
            entry_id = id_el.text if id_el is not None else ""
            updated = updated_el.text if updated_el is not None else ""
            link = link_el.get('href') if link_el is not None else ""
            content_html = content_el.text if content_el is not None else ""
            
            # Use BeautifulSoup to parse HTML content
            soup = BeautifulSoup(content_html, 'html.parser')
            
            sub_items = []
            current_type = "General"
            current_content = []
            
            # Iterate through children of body/root of HTML fragment
            for child in soup.children:
                if child.name == 'h3':
                    # If we already have accumulated content, save it under the previous type
                    if current_content or current_type != "General":
                        sub_items.append({
                            "type": current_type,
                            "html": "".join(str(c) for c in current_content).strip()
                        })
                    current_type = child.get_text().strip()
                    current_content = []
                elif child.name is not None:
                    current_content.append(child)
            
            # Save the final group
            if current_content or current_type != "General":
                sub_items.append({
                    "type": current_type,
                    "html": "".join(str(c) for c in current_content).strip()
                })
                
            # Fallback if no structured sections were found
            if not sub_items:
                sub_items.append({
                    "type": "Update",
                    "html": content_html
                })
                
            entries.append({
                "title": title,
                "id": entry_id,
                "updated": updated,
                "link": link,
                "sub_items": sub_items
            })
            
        return jsonify({
            "success": True,
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Run server locally on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)

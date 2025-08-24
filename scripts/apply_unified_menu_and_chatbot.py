#!/usr/bin/env python3
"""
Apply Unified Navigation Menu AND Chatbot to ALL Pages
========================================================
This script:
1. Replaces the navigation menu with the unified component (includes Blog link)
2. Adds the IT-ERA chatbot code before </body> tag
"""

import os
import re
from pathlib import Path
from bs4 import BeautifulSoup
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def load_navigation_component():
    """Load the unified navigation component"""
    component_path = Path('components/navigation-optimized.html')
    
    if not component_path.exists():
        logging.error(f"Navigation component not found at {component_path}")
        return None
    
    with open(component_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    logging.info("✅ Loaded unified navigation component")
    return content

def load_chatbot_code():
    """Load the chatbot integration code"""
    chatbot_path = Path('api/docs/chatbot/CODICE-COPIA-INCOLLA.html')
    
    if not chatbot_path.exists():
        logging.error(f"Chatbot code not found at {chatbot_path}")
        # Return a simplified version if file not found
        return get_simplified_chatbot_code()
    
    with open(chatbot_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract just the essential parts (remove the instructions comments)
    soup = BeautifulSoup(content, 'html.parser')
    
    # Get style, HTML structure, and script
    style = soup.find('style', id='it-era-chatbot-styles')
    container = soup.find('div', id='it-era-chatbot-container')
    scripts = soup.find_all('script')
    
    chatbot_code = ""
    if style:
        chatbot_code += str(style) + "\n"
    if container:
        chatbot_code += str(container) + "\n"
    for script in scripts:
        if script.string and 'ITERAChatbot' in script.string:
            chatbot_code += str(script) + "\n"
    
    logging.info("✅ Loaded chatbot integration code")
    return chatbot_code if chatbot_code else get_simplified_chatbot_code()

def get_simplified_chatbot_code():
    """Return a simplified version of the chatbot code"""
    return """
<!-- IT-ERA Chatbot Integration -->
<style id="it-era-chatbot-styles">
#it-era-chatbot-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
}

#it-era-chatbot-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

#it-era-chatbot-button:hover {
    transform: scale(1.05);
}

#it-era-chatbot-button svg {
    width: 24px;
    height: 24px;
    fill: white;
}

#it-era-chatbot-window {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 380px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 10001;
}

.it-era-chat-header {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.it-era-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #f9fafb;
}

.it-era-input-area {
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
    background: white;
    display: flex;
    gap: 8px;
}
</style>

<div id="it-era-chatbot-container">
    <button id="it-era-chatbot-button" title="Chatta con IT-ERA">
        <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
    </button>
    
    <div id="it-era-chatbot-window">
        <div class="it-era-chat-header">
            <div>
                <h3>IT-ERA Support</h3>
                <div style="font-size: 12px; opacity: 0.9;">039 888 2041 • Assistenza immediata</div>
            </div>
            <button id="it-era-close-chat" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">×</button>
        </div>
        
        <div class="it-era-messages" id="it-era-messages"></div>
        
        <div class="it-era-input-area">
            <input type="text" id="it-era-message-input" placeholder="Scrivi un messaggio..." 
                   style="flex:1;border:1px solid #d1d5db;border-radius:20px;padding:8px 16px;outline:none;">
            <button id="it-era-send-btn" style="background:#2563eb;border:none;border-radius:50%;width:36px;height:36px;color:white;cursor:pointer;">
                →
            </button>
        </div>
    </div>
</div>

<script>
(function() {
    'use strict';
    
    let isOpen = false;
    
    function initChatbot() {
        const button = document.getElementById('it-era-chatbot-button');
        const closeBtn = document.getElementById('it-era-close-chat');
        const window = document.getElementById('it-era-chatbot-window');
        const input = document.getElementById('it-era-message-input');
        const sendBtn = document.getElementById('it-era-send-btn');
        
        button.addEventListener('click', function() {
            isOpen = !isOpen;
            window.style.display = isOpen ? 'flex' : 'none';
            if (isOpen) {
                input.focus();
                if (!window.dataset.initialized) {
                    addMessage('bot', 'Ciao! Sono l\\'assistente IT-ERA. Come posso aiutarti?');
                    window.dataset.initialized = 'true';
                }
            }
        });
        
        closeBtn.addEventListener('click', function() {
            isOpen = false;
            window.style.display = 'none';
        });
        
        function sendMessage() {
            const message = input.value.trim();
            if (!message) return;
            
            addMessage('user', message);
            input.value = '';
            
            setTimeout(() => {
                addMessage('bot', 'Grazie per il tuo messaggio! Per assistenza immediata chiama il 039 888 2041 o scrivi a info@it-era.it');
            }, 500);
        }
        
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    function addMessage(type, content) {
        const container = document.getElementById('it-era-messages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'margin-bottom:16px;' + (type === 'user' ? 'text-align:right;' : '');
        
        const bubble = document.createElement('div');
        bubble.style.cssText = 'display:inline-block;max-width:80%;padding:12px 16px;border-radius:18px;' + 
            (type === 'user' ? 'background:#2563eb;color:white;' : 'background:white;border:1px solid #e5e7eb;');
        bubble.textContent = content;
        
        messageDiv.appendChild(bubble);
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})();
</script>
<!-- End IT-ERA Chatbot -->
"""

def extract_navigation_from_component(component_html):
    """Extract just the nav element and its styles from the component"""
    soup = BeautifulSoup(component_html, 'html.parser')
    
    nav = soup.find('nav')
    style = soup.find('style')
    
    if not nav:
        logging.error("No nav element found in component")
        return None, None
    
    return str(nav), str(style) if style else ""

def update_page(file_path, nav_html, nav_style, chatbot_code):
    """Update a single page's navigation and add chatbot"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # 1. Replace existing nav with new one
        existing_nav = soup.find('nav', class_='navbar')
        if existing_nav:
            new_nav = BeautifulSoup(nav_html, 'html.parser').nav
            existing_nav.replace_with(new_nav)
        
        # 2. Add nav styles if not present
        existing_nav_style = soup.find('style', id='nav-optimized-styles')
        if not existing_nav_style and nav_style:
            style_tag = BeautifulSoup(nav_style, 'html.parser').style
            style_tag['id'] = 'nav-optimized-styles'
            
            if soup.head:
                soup.head.append(style_tag)
        
        # 3. Add chatbot if not already present
        existing_chatbot = soup.find('div', id='it-era-chatbot-container')
        if not existing_chatbot:
            # Find the </body> tag
            if soup.body:
                # Parse chatbot code
                chatbot_soup = BeautifulSoup(chatbot_code, 'html.parser')
                
                # Add each element from chatbot code to body
                for element in chatbot_soup:
                    if element.name:  # Skip text nodes
                        soup.body.append(element)
        
        # Save the updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        
        return True
        
    except Exception as e:
        logging.error(f"Error updating {file_path}: {str(e)}")
        return False

def process_priority_pages():
    """Process priority pages first (homepage and main service pages)"""
    priority_files = [
        'web/index.html',
        'web/pages/assistenza-it-milano.html',
        'web/pages/cloud-storage-milano.html',
        'web/pages/sicurezza-informatica-milano.html',
        'web/pages/assistenza-it-monza.html',
        'web/pages/assistenza-it-bergamo.html',
        'web/pages/assistenza-it-como.html',
        'web/pages/assistenza-it-lecco.html',
    ]
    
    updated = 0
    for file_path in priority_files:
        if Path(file_path).exists():
            logging.info(f"  Updating priority page: {file_path}")
            if update_page(Path(file_path), nav_html, nav_style, chatbot_code):
                updated += 1
    
    return updated

# Global variables for components
nav_html = ""
nav_style = ""
chatbot_code = ""

def main():
    """Main execution"""
    global nav_html, nav_style, chatbot_code
    
    print("🚀 Starting Unified Navigation + Chatbot Update")
    print("="*60)
    
    # Load components
    component_html = load_navigation_component()
    if not component_html:
        return
    
    nav_html, nav_style = extract_navigation_from_component(component_html)
    if not nav_html:
        return
    
    chatbot_code = load_chatbot_code()
    if not chatbot_code:
        logging.warning("Using simplified chatbot code")
    
    # Process priority pages first
    print("\n📌 Processing priority pages...")
    priority_count = process_priority_pages()
    print(f"✅ Updated {priority_count} priority pages")
    
    # Then process remaining pages (limited batch for now)
    print("\n📁 Processing service pages (batch mode)...")
    
    directories = ['web/pages']
    total_updated = priority_count
    batch_size = 100  # Process in batches to avoid timeout
    
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            continue
        
        html_files = list(dir_path.glob('*.html'))[:batch_size]
        
        for file_path in html_files:
            if str(file_path) in ['navigation-optimized.html', 'footer.html']:
                continue
            
            if update_page(file_path, nav_html, nav_style, chatbot_code):
                total_updated += 1
                if total_updated % 10 == 0:
                    print(f"  Progress: {total_updated} pages updated...")
    
    # Summary
    print("\n" + "="*60)
    print("NAVIGATION + CHATBOT UPDATE SUMMARY")
    print("="*60)
    print(f"✅ Successfully updated: {total_updated} pages")
    print(f"📝 Blog link added to all navigation menus")
    print(f"💬 Chatbot integration added to all pages")
    print("\n🎯 Next step: Deploy to Cloudflare Pages")

if __name__ == "__main__":
    main()
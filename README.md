# DNS Server Simulator | Client-Server Architecture

## Overview
This project is an interactive, web-based simulation of a Domain Name System (DNS) server. It visually demonstrates how DNS forward and reverse lookups work using a client-server architecture model. 

Designed as a **Computer Networks Project**, the simulator provides an educational and hands-on experience without requiring any backend server configuration. It runs entirely in the browser using HTML, CSS, and JavaScript, while successfully mimicking server latency, recursive resolution paths, and real-time query logging.

## Features

- **Forward DNS Lookup (Domain → IP):** Resolve domain names to their corresponding IPv4 (A), IPv6 (AAAA), or Canonical Name (CNAME) records.
- **Reverse DNS Lookup (IP → Domain):** Perform reverse lookups to find the domain name associated with an IP address (PTR records).
- **Live Server Logs:** A built-in terminal-style console displaying real-time system events, client queries, and simulated server responses.
- **DNS Records Database:** View, filter, and manage the server's simulated zone file. This table tracks A, AAAA, CNAME, MX, NS, and PTR records.
- **Interactive Zone File Management:** Easily add custom records to the server database through an intuitive GUI and test lookups dynamically against them.
- **Query Resolution Path Visualizer:** An animated diagram showing the hierarchical flow of DNS resolution (Client → Recursive Resolver → Root → TLD → Authoritative Server).
- **System Architecture Explanation:** An educational section detailing the step-by-step process of DNS resolution according to RFC 1034 & RFC 1035.

## Technologies Used
- **HTML5:** Semantic structure and layout.
- **Vanilla CSS3:** Custom styling, modern dark/glassmorphic aesthetics, responsive design, and CSS animations.
- **Vanilla JavaScript:** Core logic, state management, record filtering, query simulations, and dynamic DOM manipulation.

## How to Use

Since this is a client-side simulator, no installation or compiling is required to test the application.

1. **Clone or Download** this repository to your local machine.
2. Navigate to the project directory.
3. Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
4. Try typing a domain like `google.com` in the **Forward DNS** card and clicking **Resolve** to see the system simulate an IP lookup.
5. Try typing an IP like `142.250.80.46` in the **Reverse DNS** card to see reverse resolution in action.

## Project Structure
- `index.html` - The main user interface structure and content.
- `style.css` - Stylesheets defining the visual look, grid layout, fonts, and micro-animations.
- `script.js` - The JavaScript engine holding the mock `DNS_RECORDS` database and logic simulating network calls and logs.

## Built By
Created for a Computer Networks curriculum to visually explain the concepts of Domain Name Systems.

import webbrowser
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from rich.console import Console

console = Console()

# Global variable to store the token temporarily during the callback
CAPTURED_TOKEN = None

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    """
    Handles the callback from the Auth Service.
    Expects GET /callback?token=eyJ...
    """
    def log_message(self, format, *args):
        # Suppress default HTTP server logging to keep CLI clean
        return

    def do_GET(self):
        global CAPTURED_TOKEN
        
        parsed_path = urlparse(self.path)
        
        # Only handle the callback path
        if parsed_path.path == "/callback":
            query_params = parse_qs(parsed_path.query)
            token_list = query_params.get("token")
            
            if token_list:
                CAPTURED_TOKEN = token_list[0]
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                
                html_content = """
                <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1 style="color: #2ecc71;">Authentication Successful</h1>
                    <p>You have successfully logged in to SecFlowCheck.</p>
                    <p>You can close this window and return to your terminal.</p>
                    <script>window.close();</script>
                </body>
                </html>
                """
                self.wfile.write(html_content.encode("utf-8"))
            else:
                self.send_response(400)
                self.wfile.write(b"Missing token in callback.")
        else:
            # Handle favicon or other browser requests without crashing
            self.send_response(404)
            self.end_headers()

def perform_oauth_login(auth_url: str, port: int = 8765, timeout: int = 60) -> str:
    """
    Opens the browser, starts a local server, and waits for the JWT.
    """
    global CAPTURED_TOKEN
    CAPTURED_TOKEN = None # Reset
    
    # Start the server
    server = HTTPServer(("localhost", port), OAuthCallbackHandler)
    
    # Open the browser
    console.print(f"[blue]Opening browser to:[/blue] {auth_url}")
    webbrowser.open(auth_url)
    
    console.print(f"[yellow]Waiting for authentication callback on port {port}...[/yellow]")

    # Wait for request (Blocking with timeout logic could be added, 
    # but handle_request blocks until 1 request comes in. 
    # We use a loop to ignore favicon requests)
    
    try:
        # Loop until we get a token or user hits Ctrl+C
        while CAPTURED_TOKEN is None:
            server.handle_request()
    except KeyboardInterrupt:
        console.print("\n[red]Login cancelled by user.[/red]")
        server.server_close()
        return None

    server.server_close()
    return CAPTURED_TOKEN
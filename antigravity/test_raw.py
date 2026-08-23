import socket
import ssl
import json
import urllib.request

req = urllib.request.Request("http://localhost:8080/sessions", method="POST")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    cid = data["container_id"]
    print("Created container:", cid)

# Now connect raw TCP and send websocket upgrade
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("localhost", 8080))
upgrade_req = (
    f"GET /sessions/{cid}/attach HTTP/1.1\r\n"
    f"Host: localhost:8080\r\n"
    f"Upgrade: websocket\r\n"
    f"Connection: Upgrade\r\n"
    f"Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
    f"Sec-WebSocket-Version: 13\r\n"
    f"Origin: http://localhost:5173\r\n"
    f"\r\n"
)
s.sendall(upgrade_req.encode())

response = s.recv(4096)
print("Handshake response:\n", response.decode(errors='replace'))

while True:
    data = s.recv(4096)
    if not data:
        print("Connection closed by server")
        break
    print("Received frame:", repr(data))

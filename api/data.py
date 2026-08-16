import os
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

HF_REPO = os.environ.get('HF_REPO', '')
HF_TOKEN = os.environ.get('HF_TOKEN', '')
HF_REVISION = os.environ.get('HF_REVISION', 'main')

ALLOWED_SUFFIXES = ('.json', '.json.gz')


def hf_url(rel):
    quoted = urllib.parse.quote(rel)
    return f'https://huggingface.co/datasets/{HF_REPO}/resolve/{HF_REVISION}/{quoted}'


def is_safe(rel):
    if not rel or rel.startswith('/'):
        return False
    if not rel.endswith(ALLOWED_SUFFIXES):
        return False
    return '..' not in rel.split('/')


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        rel = (urllib.parse.parse_qs(query).get('path') or [''])[0]

        if not is_safe(rel):
            self.send_error(400, 'bad path')
            return
        if not HF_REPO:
            self.send_error(500, 'HF_REPO is not set')
            return

        request = urllib.request.Request(hf_url(rel))
        if HF_TOKEN:
            request.add_header('Authorization', f'Bearer {HF_TOKEN}')

        try:
            with urllib.request.urlopen(request, timeout=30) as upstream:
                body = upstream.read()
        except urllib.error.HTTPError as exc:
            self.send_error(exc.code, f'upstream said {exc.reason}')
            return
        except Exception as exc:
            self.send_error(502, str(exc))
            return

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        if rel.endswith('.gz'):
            self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        self.end_headers()
        self.wfile.write(body)

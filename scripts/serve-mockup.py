# Трекер и макет на порту 3002 без кэша: обычный http.server не запрещает кэш, и браузер часами показывает старую копию.
import functools
import http.server

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer(("0.0.0.0", 3002), functools.partial(NoCache, directory="mockup")).serve_forever()

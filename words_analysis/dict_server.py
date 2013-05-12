"""
Runs a simple HTTP server which validates words passed to it as GET parameters.
Usage: python dict_server.py dict_file
Query Method: localhost:8080/?word=cat&word=hallucinate&word=noword
Returns: 1,1,0 (comma-separated list of values where 1 denotes a valid word, and 0 otherwise)
"""

from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
from urlparse import parse_qs
import sys

words_dict = {}

class DictServerHandler(BaseHTTPRequestHandler):
    """Implements dictionary-validation-as-a-service"""

    def do_GET(self):
        """Handles GET requests"""
        #try:
        get_params = parse_qs(self.path[2:])
        if 'word' in get_params:
            response = []
            for w in get_params['word']:
                w = w.upper()
                if w in words_dict:
                    response.append("1")
                else:
                    response.append("0")

            # Construct response, and send back to the client
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(','.join(response))
            self.wfile.close()
            return
        else:
            print "*** Error: Parameter must be 'word'"
            return
        #except:
        #   print "*** Error: Whoops, something bad happened- "
        #    return


def main():
    try:
        ds = HTTPServer(('', 8080), DictServerHandler)
        print "Serving delicious words..."
        ds.serve_forever()
    except KeyboardInterrupt:
        print "Downing shutters"
        ds.socket.close()

# Parse words and load them into the dict
fname = sys.argv[1]
with open(fname) as f:
    words = f.readlines()
f.close()

for word in words:
    word = word.strip()
    if word:
        words_dict[word] = 1

if __name__ == '__main__':
    main()
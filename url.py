import urllib
import sys 

url = sys.argv[0]

url = "http://stackoverflow.com"
f = urllib.request.urlopen(url)
print f.read()
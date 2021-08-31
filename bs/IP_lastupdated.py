import re
import requests

urls = []
urls.append('http://52.196.49.189/pro_list.html')
urls.append('http://52.196.49.189/pro_list.html?group=1')
urls.append('http://52.196.49.189/pro_list.html?group=3')

for url in urls:
#	print(url)
	res = requests.get(url)

	if res.status_code != 200:
		continue

	from bs4 import BeautifulSoup as bs4
	soup = bs4(res.content, 'lxml')

	elems = soup.find_all(text=re.compile("/"))
	
	for elem in elems:
		if len(elem) <= 10:
			print(elem)

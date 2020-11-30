import re
import requests

urls = []
urls.append('http://www.ron2.jp/pro_list.html')
urls.append('http://www.ron2.jp/pro_list.html?group=1')
urls.append('http://www.ron2.jp/pro_list.html?group=3')

for url in urls:
#	print(url)
	res = requests.get(url)

	if res.status_code != 200:
		continue

	from bs4 import BeautifulSoup as bs4
	soup = bs4(res.content, 'lxml')

	elems = soup.find_all(href=re.compile("pro_profile.html"))
	
	pros_tmp = []
	
	for elem in elems:
		pros_tmp.append(elem.attrs['href'].replace('pro_profile.html?id=','') + ',' + elem.text)

	pros = []
	mode = "OFF"

	for pro_tmp in pros_tmp:
		if mode == "ON":
			pros.append(pro_tmp)
			mode = "OFF"
		elif mode == "OFF":
			mode = "ON"

	for pro in pros:
		print(pro)

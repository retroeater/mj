import requests

for i in range(1,999):
	url = 'http://www.ron2.jp/pro_profile.html?id=' + str(i)
	res = requests.get(url)

	if res.status_code != 200:
		continue

	from bs4 import BeautifulSoup as bs4
	soup = bs4(res.content, 'lxml')

	elems = soup.select("td.font4")

	record = str(i) + ','
	mode = ""

	for elem in elems:
		if elem.string == "立直率":
			mode = "立直率取得"
#			print(mode)
		elif mode == "立直率取得":
#			print('立直率：' + elem.string)
			record += elem.string.replace('％','') + ','
			mode = ""
		elif elem.string == "副露率":
			mode = "副露率取得"
#			print(mode)
		elif mode == "副露率取得":
#			print('副露率：' + elem.string)
			record += elem.string.replace('％','') + ','
			mode = ""
		elif elem.string == "和了率":
			mode = "和了率取得"
#			print(mode)
		elif mode == "和了率取得":
#			print('和了率：' + elem.string)
			record += elem.string.replace('％','') + ','
			mode = ""
		elif elem.string == "　平均和了点":
			mode = "平均和了点取得"
#			print(mode)
		elif mode == "平均和了点取得":
#			print('平均和了点：' + elem.string)
			record += elem.string.replace(',','').replace('点','') + ','
			mode = ""
		elif elem.string == "放銃率":
			mode = "放銃率取得"
#			print(mode)
		elif mode == "放銃率取得":
#			print('放銃率：' + elem.string)
			record += elem.string.replace('％','') + ','
			mode = ""
		elif elem.string == "　平均放銃点":
			mode = "平均放銃点取得"
#			print(mode)
		elif mode == "平均放銃点取得":
#			print('平均放銃点：' + elem.string)
			record += elem.string.replace(',','').replace('点','') + ','
			mode = ""
		elif elem.string == "順位率　　平均順位":
			mode = "平均順位取得"
#			print(mode)
		elif mode == "平均順位取得":
#			print('平均順位取得：' + elem.string)
			record += elem.string.replace('位',',')
			mode = ""
		elif elem.string == "連対(1位+2位)率　（回数）":
			mode = "連対率取得"
#			print(mode)
		elif mode == "連対率取得":
#			print('連対率取得：' + elem.string)
			record += elem.string.replace("%",",").replace("(","").replace(")","").replace("回","")
			break

	print(record)
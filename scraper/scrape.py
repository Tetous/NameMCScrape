import os
import sys
import time
from lxml import etree
from json import dumps
from datetime import datetime

from bs4 import BeautifulSoup
import pymongo
import undetected_chromedriver.v2 as uc
from dotenv import load_dotenv
from pathlib import Path

searches = 1 # minimum searches for scraped names
betweenRequests = 2 # seconds between requests
betweenRestarts = 7 # after how many requests the browser should be restarted

# Load from env file
dotenv_path = Path('../.env')
load_dotenv(dotenv_path=dotenv_path)

atlas_url = os.getenv('ATLAS_URL')
atlas_user = os.getenv('ATLAS_USER')
atlas_pwd = os.getenv('ATLAS_PWD')
DB = "NameMC" # COULD be changed, but isnt neccessary
print("[+] Got data from .env file")

# connect to MongoDB
url = f"mongodb+srv://{atlas_user}:{atlas_pwd}@{atlas_url}/{DB}?retryWrites=true&w=majority"
client = pymongo.MongoClient(url)
db = client[DB]
print("[+] Connected to MongoDB")

# Name object
class Name():
    def __init__(self, name: str, droptime: int, searches: int = 0) -> None:
        self.name = name
        self.droptime = droptime # 9.7.2021 12:23:32
        self.searches = searches

        self.unix = round(datetime.strptime(droptime, '%Y-%m-%dT%H:%M:%S.%fZ').timestamp())
        self.updated = round(time.time())
    
    # not really used
    def __str__(self) -> str:
        return dumps({
            "name": self.name, 
            "droptime": self.droptime, 
            "UNIX": self.unix,
            "searches": self.searches, 
            "updated": self.updated 
        })

    def toDict(self) -> dict:
        return {
            "name": self.name, 
            "droptime": self.droptime, 
            "UNIX": self.unix,
            "searches": self.searches, 
            "updated": self.updated 
        }

def namesToJson(names: list) -> str:
    new = []
    for n in names:
        new.append(n.toDict())
    return new

# parses HTML of the 'upcomming names' section
def parse_data(h: str): # -> Tuple[list, str]:
    # returns a list of names and a link to the next page
    names = []
    soup = BeautifulSoup(h, features="html.parser")
    table = soup.find(lambda tag: tag.name=='tbody') 
    rows = table.findAll(lambda tag: tag.name=='tr')

    for row in rows:
        pageText = row.findAll(text=True)
        timeObj = row.findAll(lambda tag: tag.name=='time')
        stamp = timeObj[0].get("datetime")
        if len(pageText) == 4:
            names.append(Name(pageText[0], stamp))
        elif len(pageText) == 5:            
            names.append(Name(pageText[0], stamp, searches=pageText[4]))
    try:
        dom = etree.HTML(str(soup))
        link = dom.xpath('/html/body/main/div/div[5]/nav/ul/li[4]/a/@href')[0]
        return names, f"https://namemc.com{link}"
    except:
        return names, None


# start the chrome driver
options = uc.ChromeOptions()
options.add_argument('--no-first-run --no-service-autorun --password-store=basic')
driver = uc.Chrome(headless=True, options=options) 
print("[+] Started a headless browser")

url = f"https://namemc.com/minecraft-names?sort=asc&searches={searches}"
allNames = []

count = 0
while 1:    
    count += 1
    if count % betweenRestarts == 0:
        print("[+] Restarting browser")
        driver.quit()
        options = uc.ChromeOptions()
        options.add_argument('--no-first-run --no-service-autorun --password-store=basic')
        driver = uc.Chrome(headless=True, options=options) 
    
    try:
        driver.get(url)
    except Exception:
        print(f"[+] Error while getting url: {url} ({Exception})")
        print("[+] Restarting browser")
        driver.quit()
        options = uc.ChromeOptions()
        options.add_argument('--no-first-run --no-service-autorun --password-store=basic')
        driver = uc.Chrome(headless=True, options=options) 

    tmp = driver.page_source 
    names, url = parse_data(tmp)
    db.NameMC.insert_many(namesToJson(names))
    print(f"[+] Finished scraping for {url}")
    allNames += names
    time.sleep(betweenRequests)
    
print(len(allNames))
j = namesToJson(allNames)
with open("names.json", "w") as f:
    f.write(j)


driver.quit()
sys.exit() 

# $min
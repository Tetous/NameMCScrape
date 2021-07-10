# NameMC API 

This project aims to provide an API for the website [NameMC](https://namemc.com), especially the "upcomming names" section.

# How to set this up

### AtlasDB

You need to create an account at the [atlas website](https://cloud.mongodb.com). 
You then need to create a DB with the name `NameMC` (The collection that will be used is `names`)

Save the data into your .env file. Example: 
```
ATLAS_URL=clusterX.o7a2b.mongodb.net
ATLAS_USER=kqzz
ATLAS_PWD=password
```

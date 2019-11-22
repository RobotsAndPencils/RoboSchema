# RoboSchema
Easily convert SQL Schemas to Salesforce

1) clone repo
2) 'npm install'
3) update credentials in build.properties
4) run query.sql on your SQL server instance
5) save the results as input.csv
6) 'node roboSchema1.js' : converts the SQL metadata to a CSV with Salesforce metadata
7) preview / adjust transformed.csv
8) see how to add relationships in transformedWithRelationshipsAdded.csv example
9) 'node roboSchema2.js' : converts the transformed CSV to Salesforce XML metadata you can deploy
10) 'ant deploy'
11) celebrate

More info here from our Dreamforce session:
https://www.slideshare.net/danieljpeter/save-millions-of-clicks-easily-migrate-complex-schemas-from-sql-to-salesforce

var fs = require('fs');
var csv2json = require('csvtojson');
var converter = require('json-2-csv');
var rimraf = require("rimraf");

//wipe out the source dir first
rimraf.sync("./src");

//create the dirs
fs.mkdirSync("./src");
fs.mkdirSync("./src/objects");

//load the CSV
var bulkFields;
csv2json()
.fromFile('./transformed.csv')
.then((jsonObj)=>{
	bulkFields = jsonObj;
	createPackage();
})	


function createPackage() {

	//console.log(bulkFields);
	var fieldsByObject = {};
	//rip through the rows and pivot on object
	for (var i=0; i<bulkFields.length; i++) {
		var row = bulkFields[i];
		var objName = row['Object'];

		if (!(objName in fieldsByObject)) {
			fieldsByObject[objName] = [];
		}
		fieldsByObject[objName].push(row);
	}
	
	//console.log(bulkFields);
	
	//console.log('fieldsByObject', fieldsByObject);

	//create the package.xml and the object XML
	var packageTemplate = getXMLtemplate();
	var memberTemplate = '        <members>{!field}</members>';

	var fields = [];
	var objects = [];
	for (obj in fieldsByObject) {
		var memberO = memberTemplate;
		memberO = memberO.replace('{!field}', obj);
		objects.push(memberO);

		var rows = fieldsByObject[obj];
		var fieldsForObject = [];
		for (var i=0; i<rows.length; i++) {
			var row = rows[i];
			var objField = obj + '.' + row['Field Name'];
			var member = memberTemplate;
			member = member.replace('{!field}', objField);
			fields.push(member);

			fieldsForObject.push(createXMLfieldDef(row));
		}
		
		var xmlForObject = getObjectTemplate();
		var objectFieldXML = fieldsForObject.join('\n') + '\n';

		xmlForObject = xmlForObject.replace('{!label}', rows[0]['Object Label']);
		xmlForObject = xmlForObject.replace('{!labelPlural}', rows[0]['Object Plural']);

		xmlForObject = xmlForObject.replace('{!fields}', objectFieldXML);
		fs.writeFileSync('./src/objects/'+obj+'.object', xmlForObject);

	}
	var fieldsXML = fields.join('\n') + '\n';
	var objectsXML = objects.join('\n') + '\n';
	var packageXML = packageTemplate.replace('{!fields}', fieldsXML).replace('{!objects}', objectsXML);

	fs.writeFileSync('./src/package.xml', packageXML);

	
}


function createXMLfieldDef(row) {

	
/*
	//build something like this for each field
    <fields>
        <fullName>end_time__c</fullName>
        <externalId>false</externalId>
        <label>End Time</label>
        <required>false</required>
        <trackHistory>false</trackHistory>
        <trackTrending>false</trackTrending>
        <type>DateTime</type>
    </fields>
*/	
	function buildXMLfromJSON(fieldDef) {
		var x = '    <fields>\n';
		for (var key in fieldDef) {
			x += '        <' + key + '>' + fieldDef[key] + '</' + key + '>\n';
		}
		x += '    </fields>';
		//console.log('buildXMLfromJSON', x);
		return x;
	};

	


	//start with some defaults that all fields have
	var fieldDef = {};
	fieldDef.fullName = row['Field Name'];
	fieldDef.label = row['Field Label'];
	fieldDef.type = row['Type'];
    fieldDef.externalId = (row['External Id'] == '' ? 'false' : row['External Id']);
    fieldDef.required = (row['Required'] == '' ? 'false' : row['Required']);
    fieldDef.trackHistory = (row['Track Field History'] == '' ? 'false' : row['Track Field History']);
    fieldDef.trackTrending = 'false';    
    fieldDef.unique = (row['Unique'] == '' ? 'false' : row['Unique']);

    if (row['Type'] == 'Currency' || row['Type'] == 'Number' || row['Type'] == 'Percent') {
    	fieldDef.precision = row['Length'];
    	fieldDef.scale = row['Decimal Places'];
    }

    if (row['Type'] == 'Text' || row['Type'] == 'LongTextArea') {
		fieldDef.length = row['Length'];
    }

    if (row['Type'] == 'Checkbox') {
		fieldDef.defaultValue = 'false';
    }

    if (row['Type'] == 'LongTextArea') {
		fieldDef.visibleLines = (row['Visible Lines'] == '' ? '3' : row['Visible Lines']);
    }    

    if (row['Type'] == 'Lookup') {
		delete fieldDef.trackHistory;
		delete fieldDef.unique;

    	fieldDef.deleteConstraint = 'SetNull';
		fieldDef.referenceTo = row['Reference To'];
		fieldDef.relationshipLabel = row['Relationship Label'];
		fieldDef.relationshipName = row['Relationship Name'];
    }

    if (row['Type'] == 'MasterDetail') {
    	delete fieldDef.required;
		delete fieldDef.trackHistory;
		delete fieldDef.unique;	

		fieldDef.referenceTo = row['Reference To'];
		fieldDef.relationshipLabel = row['Relationship Label'];
		fieldDef.relationshipName = row['Relationship Name'];		
		fieldDef.relationshipOrder = 0;			
		fieldDef.reparentableMasterDetail = 'false';				
		fieldDef.writeRequiresMasterRead = 'false';
    }    

    return buildXMLfromJSON(fieldDef);
}




function getXMLtemplate() {

	var template = 
	'<?xml version="1.0" encoding="UTF-8"?>\n'+
	'<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n'+
	'    <types>\n{!fields}'+
	'        <name>CustomField</name>\n'+
	'    </types>\n'+
	'    <types>\n{!objects}'+
	'        <name>CustomObject</name>\n'+
	'    </types>\n'+	
	'    <version>42.0</version>\n'+
	'</Package>';

	return template;
}


function getObjectTemplate() {
	var template = 
	'<?xml version="1.0" encoding="UTF-8"?>\n'+
	'<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">\n'+

    '    <allowInChatterGroups>false</allowInChatterGroups>\n'+
    '    <compactLayoutAssignment>SYSTEM</compactLayoutAssignment>\n'+
    '    <deploymentStatus>Deployed</deploymentStatus>\n'+
    '    <enableActivities>false</enableActivities>\n'+
    '    <enableBulkApi>true</enableBulkApi>\n'+
    '    <enableFeeds>false</enableFeeds>\n'+
    '    <enableHistory>false</enableHistory>\n'+
    '    <enableReports>false</enableReports>\n'+
    '    <enableSearch>false</enableSearch>\n'+
    '    <enableSharing>true</enableSharing>\n'+
    '    <enableStreamingApi>true</enableStreamingApi>\n'+

    '{!fields}'+

    '    <label>{!label}</label>\n'+
    '    <nameField>\n'+
    '        <displayFormat>{0000000}</displayFormat>\n'+
    '        <label>{!label} Name</label>\n'+
    '        <type>AutoNumber</type>\n'+
    '    </nameField>\n'+
    '    <pluralLabel>{!labelPlural}</pluralLabel>\n'+
    '    <searchLayouts/>\n'+
    '    <sharingModel>ReadWrite</sharingModel>\n'+
    '    <visibility>Public</visibility>\n'+
	'</CustomObject>';

	return template
}




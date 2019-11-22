var fs = require('fs');
var csv2json = require('csvtojson');
var converter = require('json-2-csv');
var rimraf = require("rimraf");
var pluralize = require('pluralize');

//load the CSV
var bulkFields;
csv2json()
.fromFile('./input.csv')
.then((jsonObj)=>{
	bulkFields = jsonObj;
	transform();
})	


function transform() {

	var transformed = [];
	for (var i=0; i<bulkFields.length; i++) {
		var row = bulkFields[i];

		var dataProps = getDatatype(row.data_type_ext);

		var tableNameNoSpaces = row.table_name.replace(/ /g,'');
		var tableNameSingular = pluralize.singular(tableNameNoSpaces);
		var tableNamePlural = pluralize.plural(tableNameNoSpaces);

		var newRow = {};
		newRow.tableField				= row.table_name + '.' + row.column_name;
		newRow.table_name				= row.table_name;
		newRow.Object					= tableNameSingular + '__c';	
		newRow['Object Label']			= camelToSpaces(tableNameSingular);			
		newRow['Object Plural']			= camelToSpaces(tableNamePlural);			
		newRow.column_name				= row.column_name;
		newRow['Field Name']			= (row.column_name.replace(/ /g,'')) + '__c';				
		newRow['Field Label']			= camelToSpaces(row.column_name);
		newRow['Type']					= dataProps['Type'];
		newRow['Length']				= dataProps['Length'];
		newRow['Decimal Places']		= dataProps['Decimal Places'];	
		newRow['Reference To']			= '';
		newRow['Relationship Name']		= '';	
		newRow['Relationship Label']	= '';
		newRow['Required']				= '';	
		newRow['External Id']			= '';	
		newRow['Unique']				= '';	
		newRow['Track Field History']	= '';	

		transformed.push(newRow);
	}
	
	
	var json2csvCallback = function (err, csv) {
	    if (err) throw err;
		fs.writeFileSync('./transformed.csv', csv);
	};

	converter.json2csv(transformed, json2csvCallback, {excelBOM: true});
}




//input will be something like int or nvarchar(15)
function getDatatype(dataType) {
	dataType = dataType.replace(')', '');
	var arrDT = dataType.split('(');

	var dt = arrDT[0];
	var dtLen = (arrDT.length == 2 ? arrDT[1] : null);

	var dataProps = {
		'Type'				: '',
		'Length'			: '',
		'Decimal Places'	: ''
	};

	var dtMap = {
		'bit'		: 'Checkbox',
		'datetime'	: 'DateTime',
		'image'		: 'Text',
		'int'		: 'Number',
		'money'		: 'Currency',
		'nchar'		: 'Text',
		'ntext'		: 'Text',
		'nvarchar'	: 'Text',
		'real'		: 'Number',
		'smallint'	: 'Number',
		'sysname'	: 'Text',
		'varbinary'	: 'Text'
	};

	//set the basic data type to a Salesforce type
	var dType = '<unknown>';
	if (dt in dtMap) {
		dType = dtMap[dt];
	}
	dataProps['Type'] = dType;

	//set the field length
	if (dType == 'Text') {
		if (dtLen == 'MAX') {
			dataProps['Length'] = 255;	
		} else if (dtLen != null) {
			dataProps['Length'] = dtLen;		
		} else {
			dataProps['Length'] = 255;	
		}
	}

	if (dType == 'Currency') {
		dataProps['Length'] = 16;		
		dataProps['Decimal Places'] = 2;		
	}

	if (dt == 'int') {
		dataProps['Length'] = 10;		
		dataProps['Decimal Places'] = 0;			
	}

	if (dt == 'real') {
		dataProps['Length'] = 11;		
		dataProps['Decimal Places'] = 7;			
	}

	if (dt == 'smallint') {
		dataProps['Length'] = 5;		
		dataProps['Decimal Places'] = 0;			
	}

	return dataProps;
}




function camelToSpaces(input) {

	function getCamelCaseArray(camel) {
		var reg = /([a-z0-9])([A-Z])/g;
		return camel.replace(/([a-z])([A-Z])/g, '$1 $2');
	}

	return getCamelCaseArray(input);
}







/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Apr 2014     CCERP
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */

/* Subscriber Set Schema

{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Subscriber Set",
    "type": "array",
    "items": {
        "title": "Subscriber",
        "type": "object",
        "properties": {
            "id": {
                "description": "The unique identifier for a contract/user combination",
                "type": "integer"
            },
            "contractId": {
            	"description": "The unique identifier for a contract",
                "type": "integer"
            },
            "contractCustomer": {
            	"description": "The unique identifier for a customer",
                "type": "integer"                
            },
            "contractStartdate": {
            	"description": "The contract start date represented as a string mm/dd/yyyy",
                "type": "string"
            },
            "contractEnddate": {
            	"description": "The contract end date represented as a string mm/dd/yyyy",
                "type": "string"
            },
            "contractItems": {
                "type": "array",
                "items": {
                	"description": "The unique identifier for an item",
                    "type": "integer"
                }
            },
            "userEmail": {
				"type": "string",
				"format": "email"
            },
			"userFirstName": {
				"type": "string"
            },
            "userLastName": {
            	"type": "string"
            },
            "userActive": {
            	"type": "string",
            	"pattern": "[TF]"
            }
        },
        "required": ["id", "contractId", "contractCustomer", "contractStartdate", "contractEnddate", "contractItems", "userEmail", "userFirstName", "userLastName", "userActive"]
    }
}

// Subscriber Set Example

[
    {
        "id": 2,
        "contractId": 4201,
        "contractCustomer": 5,
		"contractStartdate": "1/1/2013",
		"contractEnddate": "3/31/2013",
        "contractItems": [1023,1024,1025],
		"userEmail": "johndoe@company.com",
		"userFirstName": "John",
		"userLastName": "Doe",
		"userActive": "T"
    },
    {
        "id": 3,
        "contractId": 4201,
        "contractCustomer": 5,
		"contractStartdate": "1/1/2013",
		"contractEnddate": "3/31/2013",
        "contractItems": [1024,1025],
		"userEmail": "annasmith@company.com",
		"userFirstName": "Anna",
		"userLastName": "Smith",
		"userActive": "T"
    }
]*/

function unique_array(array) {
	return array.sort().filter(function (item, pos, ary) {
		return !pos || item != ary[pos - 1];
	})
}

function contractuser_PageInit(){
	var customer = nlapiGetFieldValue('custrecord_contractuser_customer');
	var loadCurrentItems = function(customerId) {
		
		var searchFilter = [];
		var searchColumn = [];
		var myArray = [];
		
		var recType = "customrecord_contract_item";
		searchFilter.push(new nlobjSearchFilter('custrecord_ci_enddate', null, 'onorafter', null,'today' ));
		searchFilter.push(new nlobjSearchFilter('custrecord_ci_bill_to_customer', null, 'is', customerId));
		searchColumn.push(new nlobjSearchColumn('custrecord_ci_item', null, null));
		searchColumn.push(new nlobjSearchColumn('custrecord_ci_contract_id', null, null));
		var searchResult = nlapiSearchRecord(recType, null, searchFilter, searchColumn);
		if(isNotEmpty(searchResult)){
			for(var i = 0; i < searchResult.length; i++){
				var itemList = {};
				var ci_cont = searchResult[i].getText('custrecord_ci_contract_id');
				var ci_item = searchResult[i].getText('custrecord_ci_item');
				itemList.contract = ci_cont;
				itemList.item = ci_item;
				myArray.push(itemList);
			}
			return myArray;
		}
	}
	
	// function to create object to group items by contract.
	
	var lists = customer && loadCurrentItems(customer);
	if(lists){
		var curr_cont_item = lists.reduce(function(contracts, lists){
			contracts[lists.contract] = contracts[lists.contract] || [];
			contracts[lists.contract].push(lists.item);
			return contracts;
			} , {});
		if(curr_cont_item){
			var all_curr_item_text = "";
			for(var contract in curr_cont_item){
				all_curr_item_text += contract + "\n";
				var items = unique_array(curr_cont_item[contract]);
				for(var i = 0; i < items.length; i++){
					all_curr_item_text += "\t" + items[i] + "\n"; 
				}
				
			}
			nlapiSetFieldValue('custpage_available_item', all_curr_item_text);
		}
	}else {
		nlapiSetFieldValue('custpage_available_item', 'No item is available.');
	}
}


function contractuser_BeforeLoad(type,form,request){
	nlapiLogExecution('debug','contractuser_BeforeLoad '+type);
	var context = nlapiGetContext();
	var executioncontext = context.getExecutionContext();
	nlapiLogExecution('debug','executioncontext '+executioncontext);
	
	if(type == 'view' || type == 'edit'){
		form.setScript('customscript_ccerp_contractuser_client');
		form.addButton('custpage_contact_update', 'Update User Info', 'ta_redirect_user()');

		if(type == 'edit' && executioncontext == 'userinterface'){
			var contactId = nlapiGetFieldValue('custrecord_contractuser_contact');
			if(isNotEmpty(contactId)){
				BodyFieldDisable('custrecord_contractuser_email');
				BodyFieldDisable('custrecord_contractuser_firstname');  
				BodyFieldDisable('custrecord_contractuser_lastname');  
			}
		}
	}
	
	if(type == 'create' || type == 'edit') {
		var available_item = form.addField('custpage_available_item', 'textarea', 'Available Item(s) in Active Contract');
		available_item
			.setDisplaySize(35, 15)
			.setLayoutType('normal', 'startcol');
	}
	var customer = nlapiGetFieldValue('custrecord_contractuser_customer');
	if (type == 'create'){
		var custpage_contact = form.addField('custpage_contact','select','Contact');
		form.insertField(custpage_contact,'custrecord_contractuser_email');

		if (executioncontext == 'userinterface'){
			//BodyFieldDisable('custrecord_contractuser_contact');
			BodyFieldDisable('custrecord_contractuser_email');
			BodyFieldDisable('custrecord_contractuser_firstname');
			BodyFieldDisable('custrecord_contractuser_lastname');
			BodyFieldHide('custrecord_contractuser_contact');
		}
		if (isNotEmpty(customer)){
			var custFlds = ['isperson','email'];			
			var custVals = nlapiLookupField('customer',customer,custFlds);
			var isInd = custVals['isperson'];
			var email = custVals['email'];
			nlapiLogExecution('debug','isInd '+isInd);
			if (isInd == 'T'){
				nlapiSetFieldValue('custpage_contact',customer);
				nlapiSetFieldValue('custrecord_contractuser_contact',customer);
				nlapiSetFieldValue('custrecord_contractuser_email',email);
				custpage_contact.setDisplayType('hidden');
			}
			//add contacts as select options
			else{
				BodyFieldDisable('custpage_contact');
				custpage_contact.addSelectOption('','');
				contactFils = [];
				contactCols = [];
				contactFils.push(new nlobjSearchFilter('company',null,'is',customer));
				contactCols.push(new nlobjSearchColumn('entityid'));
				var contactResults = nlapiSearchRecord('contact',null,contactFils,contactCols);
				if (isNotEmpty(contactResults)){
					for (var i = 0; i<contactResults.length; i++ ){
						var contactTxt = contactResults[i].getValue('entityid');
						var contactId = contactResults[i].getId();
						custpage_contact.addSelectOption(contactId,contactTxt);
					}
				}
			}
		}
	}
}

function contractuser_BeforeSubmit(type){
	nlapiLogExecution('debug','contractuser_BeforeSubmit '+type);
	if(type=='create' || type=='edit' || type=='copy'){
		var contractCustomer = nlapiGetFieldValue('custrecord_contractuser_customer');
		var isInd = nlapiLookupField('customer',contractCustomer,'isperson');
		var userEmail = nlapiGetFieldValue('custrecord_contractuser_email');
		var userFirstName = nlapiGetFieldValue('custrecord_contractuser_firstname');
		var userLastName = nlapiGetFieldValue('custrecord_contractuser_lastname');
		var contact = nlapiGetFieldValue('custrecord_contractuser_contact');
		if (isEmpty(contact)){
			var conid = '';
			if (isInd != 'T'){
				//First Seach for Contact for customer with user email
				var conFils = [];
				
				conFils.push(new nlobjSearchFilter('firstname', null, 'is', userFirstName));
				conFils.push(new nlobjSearchFilter('lastname', null, 'is', userLastName));
				conFils.push(new nlobjSearchFilter('email', null, 'is', userEmail));
				conFils.push (new nlobjSearchFilter('company',null,'anyof',[contractCustomer]));
				conFils.push (new nlobjSearchFilter('isinactive',null,'is','F'));
				var conResults = nlapiSearchRecord('contact',null,conFils);
				if (isNotEmpty(conResults)){
					conid = conResults[0].getId();
					var contactEmail = nlapiLookupField('contact', conid, 'email');
					if(contactEmail != userEmail){
						nlapiSubmitField('contact', conid, 'email', userEmail);
					}
				}
				else{
				//Create Contact Record
					try{
						var conrec = nlapiCreateRecord('contact');
						conrec.setFieldValue('firstname',userFirstName);
						conrec.setFieldValue('lastname',userLastName);
						conrec.setFieldValue('company',contractCustomer);
						conrec.setFieldValue('email',userEmail);
						conrec.setFieldValue('contactrole','2');
						conid = nlapiSubmitRecord(conrec);
					}
					catch(e){
						nlapiLogExecution('AUDIT', 'Contact Error', e);
						var conrec2 = nlapiCreateRecord('contact');
						conrec2.setFieldValue('firstname',userFirstName);
						conrec2.setFieldValue('lastname',userLastName);
						conrec2.setFieldValue('company',contractCustomer);
						conrec2.setFieldValue('email',userEmail);
						conrec2.setFieldValue('entityid', userFirstName + ' ' + userLastName + '2');
						conrec2.setFieldValue('contactrole','2');
						conid = nlapiSubmitRecord(conrec2);
					}
				}
			}
			else{
				conid = contractCustomer;
			}
			nlapiSetFieldValue('custrecord_contractuser_contact',conid);
			nlapiSetFieldValue('custrecord_contractuser_email',userEmail);
		}
		
		// setting ipuser flag
		if(nlapiGetFieldValue('custrecord_contractuser_sso') != 'T'){
			var items = nlapiGetFieldValues('custrecord_contractuser_items');
			var ipCounter = 0;
			nlapiLogExecution('DEBUG', 'Before Submit', 'items : ' + items);
			if(items.length > 0){
				for(var i = 0; i < items.length; i++){
					var isip = nlapiLookupField('item', items[i], 'custitem_is_iplicense');
					if((items[i] != '2069' && items[i] != '2068' ) && isip == 'T'){
						ipCounter++;
					}
				}
			}
			nlapiLogExecution('DEBUG', 'Before Submit', 'ipCounter : ' + ipCounter);
			(ipCounter > 0) ? nlapiSetFieldValue('custrecord_webuser_is_ip', 'T') : nlapiSetFieldValue('custrecord_webuser_is_ip', 'F'); 
		}
	}
}

function contractuser_AfterSubmit(type){
	nlapiLogExecution('debug','contractuser_AfterSubmit '+type);
	
	if(type=='create' || type=='edit' || type=='copy'){
		
		////////////////////////////////////////////////////////////////////
		///////////// SUBMIT HTTP POST TO DRUPAL ///////////////////////////
		////////////////////////////////////////////////////////////////////
		
		// 1. Get all fields for this record and package into JSON
		var id = nlapiGetRecordId();
		var contractId = nlapiGetFieldValue('custrecord_contractuser_contract');
		if (isEmpty(contractId))
			contractId = '';
		var contractCustomer = nlapiGetFieldValue('custrecord_contractuser_customer');
		var contractStartdate = nlapiGetFieldValue('custrecord_contractuser_startdate');
		var contractEnddate = nlapiGetFieldValue('custrecord_contractuser_endate');
		var contractItems = nlapiGetFieldValues('custrecord_contractuser_items');
		var userEmail = nlapiGetFieldValue('custrecord_contractuser_email');
		var userFirstName = nlapiGetFieldValue('custrecord_contractuser_firstname');
		var userLastName = nlapiGetFieldValue('custrecord_contractuser_lastname');
		var userActive = nlapiGetFieldValue('custrecord_contractuser_activeflag');
		var callbackurl = nlapiGetFieldValue('custrecord_contractuser_callbackurl');
		var contact = nlapiGetFieldValue('custrecord_contractuser_contact');
		var freetrial = nlapiGetFieldValue('custrecord_contractuser_freetrial');
		var isipuser = nlapiGetFieldValue('custrecord_webuser_is_ip');
		var isSSO = nlapiGetFieldValue('custrecord_contractuser_sso');
		var cuiItems = [];
			for(var it in contractItems){
				cuiItems.push(contractItems[it]);
			}
		//nlapiLogExecution('debug','contractItems',contractItems);
		
		//Get Members From Kits and add to contractItems Arr
		var memArr = [];
		var contractItemsNoKits = [];
		for (var i in contractItems){
			var itemId = contractItems[i];
			var itemtype = nlapiLookupField('item',itemId,'type');
			nlapiLogExecution('debug','contractItems[i] '+itemId+'i '+i);
			if (itemtype == 'Kit'){
				var kitFils = [];
				kitFils.push(new nlobjSearchFilter('internalid',null,'is',itemId));
				var kitresults = nlapiSearchRecord(null,'customsearch__getkit_member_items',kitFils);
				if(isNotEmpty(kitresults)){
					nlapiLogExecution('debug','kitresults.length '+kitresults.length);
					for(var k=0;k<kitresults.length;k++){
						var memId = kitresults[k].getValue('memberitem');
						nlapiLogExecution('debug','memId '+memId,contractItems.length);
						if (memArr.indexOf(memId)==-1)
							memArr.push(memId);
					}
				}
			}
			else
				contractItemsNoKits.push(itemId);
		}
		
		if (isNotEmpty(memArr))
			contractItems = contractItemsNoKits.concat(memArr);
		
				
		var jsonObj = {
			"id": id,
	        "contractId": contractId,
	        "contractCustomer": contractCustomer,
			"contractStartdate": contractStartdate,
			"contractEnddate": contractEnddate,
	        "contractItems": contractItems,
			"userEmail": userEmail,
			"userFirstName": userFirstName,
			"userLastName": userLastName,
			"userActive": userActive,
			"contact": contact,
			"freetrial": freetrial,
			"ipuser": isipuser,
			"isSSO": isSSO
		};
		
		var jsonStr = JSON.stringify(jsonObj);
		nlapiLogExecution('debug','jsonStr',jsonStr);
		
		// 2. Attach headers, JSON to HTTP POST and send request
		var headers = new Array();
		headers['User-Agent-x'] = 'SuiteScript-Call';
		headers['Content-Type'] = 'application/json';
		
		// Determine target url (Drupal PROD vs. Drupal DEV)
		//var url = 'http://dev.taxnotes.com/api/customers'; // This is the default Development server
		//var url = 'http://taxanalysts.prod.acquia-sites.com/api/customers'; // This is the default production server
		var url = 'http://dev.taxnotes.com/api/customers';//new URL added by CY 03/17/2015
//		if(callbackurl)
//			url = callbackurl;
		
		/////////////////// from Pablo Tapia 11/13/2014 ////////////////////////////////////////////////////////////////////////
		// Is it too much to ask if you can temporarily set up an alias for this URL (http://www.taxnotes.com/api/customers.) 
		// to point to this URL (http://taxanalysts.prod.acquia-sites.com/api/customers")? I understand if it's not possible and 
		// we're taking precautions so users use the long URL.
		//if(url=='http://www.taxnotes.com/api/customers')
			//url = 'http://taxanalysts.prod.acquia-sites.com/api/customers';
		
		var response = nlapiRequestURL(url, jsonStr, headers);
		
		// 3. Validate response
		nlapiLogExecution('DEBUG', 'response body',response.getBody());
		nlapiLogExecution('DEBUG', 'response code',response.getCode());
		
	
		
		// send email when fails 
		if(response.getCode() != '200'){	
			nlapiSendEmail(54452, ['alberto.jimenez@taxanalysts.org', 'chan.yi@taxanalysts.org', 'andrew.lin@taxanalysts.org'], 'WARNING! There was an error creating a user in Drupal', 'Response from Drupal ' + response.getBody() + '\n' + 'JSON in NetSuite: \n' + JSON.stringify(jsonObj), null, null, id, null, null, null);	
		}
		
		// Clear out callbackurl on Contract User record
		if(callbackurl)
			nlapiSubmitField('customrecord_contractuser',id,'custrecord_contractuser_callbackurl','');
		var freetrial = nlapiGetFieldValue('custrecord_contractuser_freetrial');
		if (freetrial != 'T'){
			//Create Contract User Item Records
			nlapiLogExecution('debug','Creating CU Items');
			var cuitems = [];
			var cuitemfils = [];
			var cuitemcols = [];
			var cuitemResults = '';
			cuitemfils.push(new nlobjSearchFilter('custrecord_conuseritem_user',null,'is',id));
			//cuitemfils.push(new nlobjSearchFilter('internalid','custrecord_conuseritem_contract','is',contractId));
			cuitemcols.push(new nlobjSearchColumn('custrecord_conuseritem_itemname'));
			//if (isNotEmpty(contractId))
			cuitemResults = nlapiSearchRecord('customrecord_conuseritem',null,cuitemfils,cuitemcols);
			if (isNotEmpty(cuitemResults)){	
				for(var i=0;i<cuitemResults.length;i++){
					var cuitem = cuitemResults[i].getValue('custrecord_conuseritem_itemname');
					if (cuiItems.indexOf(cuitem)==-1){
						var cuitemid = cuitemResults[i].getId();
						nlapiDeleteRecord('customrecord_conuseritem',cuitemid);
					}
					else
					cuitems.push(cuitem);
				}
			}
			var createCUItask = false;
			for (var cui in cuiItems){
				
				if (cuitems.indexOf(cuiItems[cui])==-1 || isEmpty(cuitemResults)){
					//Search for contract item to associate
					//for results get count of CUI records and compare to qty
					//if count is less then qty create record
					//else Create task and CUI record
					//Not throwing error at this time
					if (isNotEmpty(contractId)){
						var isIP = nlapiLookupField('item',cuiItems[cui],'custitem_is_iplicense');
						if (isIP != 'T'){
							var ciJSON = ccerpGetActiveContractItemsQty(contractId,cuiItems[cui]);
							if (isNotEmpty(ciJSON)){
								var ciitem = ciJSON[0].ciitem;
								var ciitemqty = ciJSON[0].ciqty;
								//nlapiLogExecution('debug','215 ciJSON','ciitem '+ciitem+' ciitemqty '+ciitemqty);
								//Search for contract user item records for this contract item
								var cuitemfils = [];
								var cuitemcols = [];
								cuitemfils.push(new nlobjSearchFilter('custrecord_contractuser_activeflag','custrecord_conuseritem_user','is','T'));
								cuitemfils.push(new nlobjSearchFilter('custrecord_conuseritem_contract',null,'is',contractId));
								cuitemfils.push(new nlobjSearchFilter('custrecord_conuseritem_itemname',null,'is',ciitem));
								var cuitemResults = nlapiSearchRecord('customrecord_conuseritem',null,cuitemfils,cuitemcols);
								if (cuitemResults){
									var cuicount = cuitemResults.length;
									//nlapiLogExecution('debug','224 cuicount',cuicount);
									if (cuicount >= ciitemqty)
										createCUItask = true;
								}
							}
						}	
					}
					//Create CUI Record
					var cuirec = nlapiCreateRecord('customrecord_conuseritem');
					cuirec.setFieldValue('custrecord_conuseritem_itemname',cuiItems[cui]);
					if (contractId)
						cuirec.setFieldValue('custrecord_conuseritem_contract',contractId);
					cuirec.setFieldValue('custrecord_conuseritem_user',id);
					cuirec.setFieldValue('custrecord_conuseritem_customer',contractCustomer);
					nlapiSubmitRecord(cuirec);
				}
			
				if(createCUItask == false && isEmpty(contractId)){
					//Search For open task for this contract user if no results create task
					var taskfils = [];
					taskfils.push(new nlobjSearchFilter('status',null,'noneof',['COMPLETE']));
					taskfils.push(new nlobjSearchFilter('internalid','custevent_related_contractuser','anyof',[id]));
					var taskresults = nlapiSearchRecord('task',null,taskfils);
					if (isEmpty(taskresults)){
						createCUItask = true;
					}
				}
				var activeFlag = nlapiGetFieldValue('custrecord_contractuser_activeflag');
				if (createCUItask == true && activeFlag == 'T'){
					var taskfils = [];
					taskfils.push(new nlobjSearchFilter('status',null,'noneof',['COMPLETE']));
					taskfils.push(new nlobjSearchFilter('internalid','custevent_related_contractuser','anyof',[id]));
					var taskresults = nlapiSearchRecord('task',null,taskfils);
					if (isEmpty(taskresults)){
						var rep = nlapiLookupField('customer',contractCustomer,'salesrep');
						var taskrec = nlapiCreateRecord('task');
						taskrec.setFieldValue('title','Contract user variance for contract: '+contractId);
						taskrec.setFieldValue('company',contractCustomer);
						if (isNotEmpty(rep))
							taskrec.setFieldValue('assigned',rep);
						else
							taskrec.setFieldValue('assigned','17634');//SHARON CALVERT
						taskrec.setFieldValue('contact',contact);
						taskrec.setFieldValue('custevent_related_contractuser',id);
						taskrec.setFieldValue('custevent_contract',contractId);
						taskrec.setFieldValue('custevent_relatedwebuser_item',cuiItems[cui]);
						var taskid = nlapiSubmitRecord(taskrec);
						nlapiLogExecution('debug','taskid '+taskid);
					}
				}
			}	
		}
	}
}

/**
 * @returns {Boolean}
 */
function contractUserSaveRecord(){
	
	/*var freetrial = nlapiGetFieldValue('custrecord_contractuser_freetrial');
	if (freetrial != 'T'){
		BodyFieldMandatory('custrecord_contractuser_contract');
	}*/
	
	//Validate Available Contract Items
	var contractid = nlapiGetFieldValue('custrecord_contractuser_contract');
	var items = nlapiGetFieldValues('custrecord_contractuser_items');
	var contactId = nlapiGetFieldValue('custrecord_contractuser_contact');
	//alert(contactId);
	if(isNotEmpty(contractid)){
		var ciJSON = ccerpGetContractItems(contractid);
		if(nlapiGetRole() !== '3'){
			if (isNotEmpty(ciJSON)){
				var ciitemtxtArr = [];
				var ciitemsArr = [];
				var availItemsArr = [];
				for(var ci in ciJSON){
					var ciitemid = ciJSON[ci].ciitem;
					var ciitemTxt = ciJSON[ci].ciitemTxt;
					if (availItemsArr.indexOf(ciitemTxt)==-1)
						availItemsArr.push(ciitemTxt);
					ciitemsArr.push(ciitemid);
				}
				for (var cui in items){ 
					if (ciitemsArr.indexOf(items[cui])==-1){
						var cuitemtxt = nlapiLookupField('item',items[cui],'name');
						ciitemtxtArr.push(cuitemtxt);
					}
				}
				if (isNotEmpty(ciitemtxtArr)){
					alert('There are no contract items for the following items:\n\n '+ciitemtxtArr+'\n\nThe following Items are available:\n\n'+availItemsArr);
					return false;
				}
			}
			else{
				alert('No items Found Sales Order may need to be approved');
				return false;
			}
		}
	}
	if (isEmpty(contactId)){
		var msg = 'There is no contact associated.';
			msg +='\nClick Cancel to select or create a contact.';
			msg +='\nClick OK for NetSuite to create a contact for this record.';
		var r = confirm(msg);
		if (r == false)
			return false;
	}
	return true;
}

function contractUser_postSourcing(type,name){
	if (name == 'custrecord_contractuser_contact'){
		var contactId = nlapiGetFieldValue('custrecord_contractuser_contact');
		if (isNotEmpty(contactId)){
			var email = nlapiLookupField('contact',contactId,'email');
			if (isNotEmpty(email))
				nlapiSetFieldValue('custrecord_contractuser_email',email);
		}	
	}
}

function contractUser_fieldChanged(type,name){
	if (name == 'custpage_contact'){
		var contact = nlapiGetFieldValue(name);
		nlapiSetFieldValue('custrecord_contractuser_contact',contact,true,true);
	}
	if (name == 'custrecord_contractuser_contract' || name == 'custrecord_contractuser_freetrial'){
		var contract = nlapiGetFieldValue('custrecord_contractuser_contract');
		var freetrial = nlapiGetFieldValue('custrecord_contractuser_freetrial');
		if (isNotEmpty(contract) || freetrial == 'T'){
			BodyFieldNormal('custpage_contact');
			BodyFieldNormal('custrecord_contractuser_email');
			BodyFieldNormal('custrecord_contractuser_firstname');
			BodyFieldNormal('custrecord_contractuser_lastname');
			if (freetrial == 'T' && isEmpty(contract)){
				nlapiSetFieldValue('custrecord_contractuser_startdate',nlapiDateToString(new Date()));
				nlapiSetFieldValue('custrecord_contractuser_endate',nlapiDateToString(nlapiAddDays(new Date(),7)));
				BodyFieldDisable('custrecord_contractuser_contract');
			}
		}	
		
		if(isNotEmpty(contract) && freetrial == 'T'){
			nlapiSetFieldValue('custrecord_contractuser_freetrial', 'F', true, true);	
		}
		
		if (freetrial != 'T' && isEmpty(contract)){
			BodyFieldNormal('custrecord_contractuser_contract');
			nlapiSetFieldValue('custpage_contact','');
			nlapiSetFieldValue('custrecord_contractuser_email','');
			nlapiSetFieldValue('custrecord_contractuser_firstname','');
			nlapiSetFieldValue('custrecord_contractuser_lastname','');
			nlapiSetFieldValue('custrecord_contractuser_startdate','');
			nlapiSetFieldValue('custrecord_contractuser_endate','');
			BodyFieldDisable('custpage_contact');
			BodyFieldDisable('custrecord_contractuser_email');
			BodyFieldDisable('custrecord_contractuser_firstname');
			BodyFieldDisable('custrecord_contractuser_lastname');
		}
	}
}

function contractUser_validateField(type,name){
	
	var freetrial = nlapiGetFieldValue('custrecord_contractuser_freetrial');
	if (freetrial != 'T'){
		if (name == 'custrecord_contractuser_email'){
			var email = nlapiGetFieldValue(name);
			if (isNotEmpty(email)){
				var contractId = nlapiGetFieldValue('custrecord_contractuser_contract');
				if (isNotEmpty(contractId)){
					var cufils = [];
					cufils.push(new nlobjSearchFilter('custrecord_contractuser_contract',null,'is',contractId));
					cufils.push(new nlobjSearchFilter('custrecord_contractuser_email',null,'is',email));
					cufils.push(new nlobjSearchFilter('custrecord_contractuser_activeflag',null,'is','T'));
					var curesults = nlapiSearchRecord('customrecord_contractuser', null, cufils);
					if (isNotEmpty(curesults)){
						var cuid = curesults[0].getId();
						var msg = 'There is an existing Web User with this email. '+email;
						msg +='\nClick OK to load this Web user record';
						msg +='\nClick Cancel to clear form';
						var r = confirm(msg);
						if (r == true){
							var url = nlapiResolveURL('RECORD','customrecord_contractuser',cuid);
							window.open(url,'_self');
							
						}
						else{
							location.reload(true);
						}
					}
				}	
			}	
		}
	}
	return true;
}

function postIpUsers_RESTlet(datain) {
	//customscript_postipusers_restlet
	// External URL https://rest.na1.netsuite.com/app/site/hosting/restlet.nl?script=114&deploy=1
	
	// create contractUser record using posted data
	
	/*datain structure
	    "contractId" : contractId, - DEPRECATED 08/22/2015
	{
	    "customerId" : customerId, - REPLACED contractId 08/22/2015 
	    "email" : email,
	    "firstname" : firstname,
	    "lastname" : lastname,
	    "isSSO" : "T"
	    
	   
	    
	}*/
	
	var err = new Object();
	var contractId = '';
	nlapiLogExecution('debug', 'postIpUsers_RESTlet', 'BEGIN');
	
	nlapiLogExecution('debug', 'postIpUsers_RESTlet', 'datain '+JSON.stringify(datain));
	
	// Validate if mandatory fields are set in the request
	if (!datain.customerId) {
		err.status = 'Fail';
		err.code = 'Missing Required Field';
		err.details = 'customerId';
		return err;
	}
	
	if (!datain.email) {
		err.status = 'Fail';
		err.code = 'Missing Required Field';
		err.details = 'email';
		return err;
	}
	
	if (!datain.firstname) {
		err.status = 'Fail';
		err.code = 'Missing Required Field';
		err.details = 'firstname';
		return err;
	}
	
	if (!datain.lastname) {
		err.status = 'Fail';
		err.code = 'Missing Required Field';
		err.details = 'lastname';
		return err;
	}
	
	// Update user info if isUpdate is set to "T"
	if(datain.isUpdate == 'T'){
		var contactRec = nlapiLoadRecord('contact', datain.contactId);
		contactRec.setFieldValue('custentity_update_web_user', 'T');
		contactRec.setFieldValue('firstname', datain.firstname );
		contactRec.setFieldValue('lastname', datain.lastname );
		contactRec.setFieldValue('email', datain.email);
		var updatedContactId = nlapiSubmitRecord(contactRec);
		nlapiLogExecution('debug', 'Updated Contact', updatedContactId);
	}
	else{
	
		// If referer URL is provided, then we set the custrecord_contractuser_callbackurl field on the Contract User record
		// which will trigger a call back to the referer URL during ContractUser_AfterSubmit. If no referer is provided,
		// ContractUser_AfterSubmit calls back to the Drupal PRODUCTION site by default. This way, the Drupal Dev team
		// can test with their DEV server and callbacks will be directed to the desired URL.
		var referer = datain.referer;
		nlapiLogExecution('debug', 'referer', referer);
		
		//First Search for all IP contracts for this customer
		var contractARR = [];
		//contractARR.push(datain.contractId);
		var customerId = datain.customerId;
		nlapiLogExecution('debug','customerId',+customerId);
		var contractFils = [];
		contractFils.push(new nlobjSearchFilter('custrecord_ci_bill_to_customer',null, 'is', customerId));
		//contractFils.push(new nlobjSearchFilter('custrecord_ci_contract_id',null, 'noneof', [datain.contractId]));
		var contractResults = nlapiSearchRecord('customrecord_contract_item','customsearch_multi_ip_items_customers_2',contractFils);
		if (isNotEmpty(contractResults)){
			contractIds = contractResults[0].getValue('formulatext',null,'MAX').split(',');
			for (var cid in contractIds){
				nlapiLogExecution('debug','contractIds[cid]',+contractIds[cid]);
				if (contractARR.indexOf(contractIds[cid]) == -1){
					contractARR.push((contractIds[cid]));
				}
			}
			var contractARRSTR = JSON.stringify(contractARR);
			nlapiLogExecution('debug','contractARRSTR before Shift',contractARRSTR);
	
			if (isNotEmpty(contractARR)){
				contractId = contractARR.shift();
				contractARRSTR = JSON.stringify(contractARR);
				nlapiLogExecution('debug','contractARRSTR after shift',contractARRSTR);
			}
		}
		
		
		
		try{
			if (isNotEmpty(contractId)){
				nlapiLogExecution('debug','contractId',contractId);	
				nlapiLogExecution('debug','contractARR.length',contractARR.length);
				// search for contract items
				var items = [];
				var cifils = [];
				var cicols = [];
				cifils.push(new nlobjSearchFilter('custrecord_ci_contract_id',null,'is',contractId));
				cicols.push(new nlobjSearchColumn('custrecord_ci_item',null,'group'));
				cicols.push(new nlobjSearchColumn('type','custrecord_ci_item','group'));
				cicols.push(new nlobjSearchColumn('custrecord_contracts_end_user','custrecord_ci_contract_id','group'));
				cicols.push(new nlobjSearchColumn('custrecord_contracts_start_date','custrecord_ci_contract_id','group'));
				cicols.push(new nlobjSearchColumn('custrecord_contracts_end_date','custrecord_ci_contract_id','group'));
				var ciresults = nlapiSearchRecord('customrecord_contract_item','customsearch__contractitems_per_contract',cifils,cicols);
				if(isNotEmpty(ciresults)){
					nlapiLogExecution('debug','ciresults.length',ciresults.length);
					//var customer = ciresults[0].getValue('custrecord_contracts_end_user','custrecord_ci_contract_id','group');
					//var startdate = ciresults[0].getValue('custrecord_contracts_start_date','custrecord_ci_contract_id','group');
					//var enddate = ciresults[0].getValue('custrecord_contracts_end_date','custrecord_ci_contract_id','group');
					for(var i=0;i<ciresults.length;i++){
						var ci = ciresults[i].getValue('custrecord_ci_item',null,'group');
						//nlapiLogExecution('debug', 'postIpUsers_RESTlet', 'ci '+ci);
						
						if(items.indexOf(ci)==-1)
							items.push(ci);
						
					}
					nlapiLogExecution('debug', 'postIpUsers_RESTlet', 'items '+items);
					
					var record = '';
					// id must be a contract user record id
					if(datain.contractuserId)
						record = nlapiLoadRecord('customrecord_contractuser',datain.id);
					else
						record = nlapiCreateRecord('customrecord_contractuser');
					
					record.setFieldValue('custrecord_contractuser_contract',contractId);
					record.setFieldValue('custrecord_contractuser_email',datain.email);
					record.setFieldValue('custrecord_contractuser_firstname',datain.firstname);
					record.setFieldValue('custrecord_contractuser_lastname',datain.lastname);
					record.setFieldValue('custrecord_contractuser_customer',customerId);
					//record.setFieldValue('custrecord_contractuser_startdate',startdate);
					//record.setFieldValue('custrecord_contractuser_endate',enddate);
					record.setFieldValues('custrecord_contractuser_items',items);
					record.setFieldValue('custrecord_contractuser_activeflag','T');
					record.setFieldValue('custrecord_contractuser_callbackurl',referer);
					if(datain.isSSO == "T"){
						record.setFieldValue("custrecord_contractuser_sso", "T");
					}
					
					var recordId = nlapiSubmitRecord(record);
					nlapiLogExecution('DEBUG', 'postIpUsers_RESTlet','record id ' + recordId);
					var contactId = nlapiLookupField('customrecord_contractuser',recordId,'custrecord_contractuser_contact');
				}
				else{
					err.status = 'Fail';
					err.code = 'No Contract Items for Contract Id '+contractId;
					err.details = '';
					return err;
				}
			}
			else{
				err.status = 'Fail';
				err.code = 'No Contract for Customer '+customerId;
				err.details = '';
				return err;
			}
		}
		catch(e){
			nlapiLogExecution('error', 'Exception', e);
			err.status = 'Fail';
			err.code = e.code;
			err.details = e.details;
			return err;
		}
		
		if (isNotEmpty(contractARR)){
			
			var datainStr = JSON.stringify(datain);
			var contractARRStr = JSON.stringify(contractARR);
			params = [];
			params['custscript_contactid'] = contactId;
			params['custscript_datainstr'] = datainStr;
			params['custscript_contractarr'] = contractARRStr;
			params['custscript_customerid'] = customerId;
			nlapiScheduleScript('customscript_ccerp_multicontractipusers',null,params);
		}
		
		var nlobj = nlapiLoadRecord('customrecord_contractuser', recordId);
		return {'status':'success','record':nlobj};
	}
}

function credentials() {
	this.email = 'web.service@tax.org';
	this.account = '1257021';
	this.role = '3';
	this.password = 'Ingenia##1';
}

function callRestletPOST(){
	// Setting up URL
	var url = 'https://rest.na1.netsuite.com/app/site/hosting/restlet.nl?script=114&deploy=1'; // postIpUsers_RESTlet
	//var url = 'https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=113&deploy=1'; // postNewRecord_RESTlet
	
	
	// Calling credential function
	var cred = new credentials();

	// Setting up Headers
	var headers = new Array();
	headers['User-Agent-x'] = 'SuiteScript-Call';
	headers['Authorization'] = 'NLAuth nlauth_account=' + cred.account
			+ ', nlauth_email=' + cred.email + ', nlauth_signature='
			+ cred.password + ', nlauth_role=' + cred.role;
	headers['Content-Type'] = 'application/json';
	
	// Setting up Datainput for postIpUsers_RESTlet
	/*var jsonobj = {
		"recordtype" : "lead",
		"email" : "test@test.com",
		"firstname" : "Test",
		"lastname" : "Test",
		"phone" : "520",
		"comments" : "Test",
		"custentity_esc_industry" : "id",
		"custentity_esc_subsegment" : "id",
		"companyname" : "Test",
		"custentity_ta_position_level" : "id",
		"zip" : "12345"
	};*/
	
	// Setting up Datainput for postNewRecord_RESTlet
	var jsonobj = {
		"recordtype" : "prospect",
		"email" : "test@test.com",
		"firstname" : "Test",
		"lastname" : "Test",
		"phone" : "520"
	};
	

	// Stringifying JSON
	var myJSONText = JSON.stringify(jsonobj);

	var response = nlapiRequestURL(url, myJSONText, headers);
	alert(response.getBody());
	//var responseobj = JSON.parse(response.getBody());
	//alert(JSON.stringify(responseobj));
}

function ccerpUpdateContractUserSCHED(){
	
	nlapiLogExecution('debug','Sched Running');
	//return;
	var context = nlapiGetContext();
	var contractIds = context.getSetting('SCRIPT', 'custscript_cu_contractids');
	var contractId = context.getSetting('SCRIPT', 'custscript_cu_contractid');
	var enddate = context.getSetting('SCRIPT', 'custscript_cu_enddate');
	contractIds = JSON.parse(contractIds);
	
	nlapiLogExecution('debug','contractIds ',contractIds);
	var cuFils = [];
	//var cuCols = [];
	cuFils.push(new nlobjSearchFilter('custrecord_contractuser_activeflag',null,'is','T'));
	cuFils.push(new nlobjSearchFilter('custrecord_contractuser_contract',null,'anyof',contractIds));
	var cuResults = nlapiSearchRecord('customrecord_contractuser',null,cuFils);
	if (isNotEmpty(cuResults)){
		nlapiLogExecution('debug','cuResults.length '+cuResults.length);
		for(var cu=0;cu<cuResults.length;cu++){
			var cuid = cuResults[cu].getId();
			nlapiLogExecution('debug','cuid '+cuid);
			var curec =nlapiLoadRecord('customrecord_contractuser',cuid);
			var startdate = curec.getFieldValue('custrecord_contractuser_startdate');
			nlapiLogExecution('debug','startdate',startdate);
			curec.setFieldValue('custrecord_contractuser_contract',contractId);
			curec.setFieldValue('custrecord_contractuser_endate',enddate);
			curec.setFieldValue('custrecord_contractuser_startdate',startdate);
			try {
			nlapiSubmitRecord(curec);
			}
			catch(e){
				nlapiLogExecution('error', 'Exception', e);
			}
		}
	}	
}

function ccerp_updateContractUsers_Suitelet(request, response){
	nlapiLogExecution('debug','Start Update Contract Users');
	
	if(request.getMethod() == 'GET'){
		var custId = request.getParameter('custId');
		var form = nlapiCreateForm('Update Contract Users');
		
		form.addField('custid','select','customer','customer').setDisplayType('inline').setDefaultValue(custId);
		var itemsfld = form.addField('items','multiselect','items','items');
		//Get items and add as select Options
		var ciFils = [];
		ciFils.push(new nlobjSearchFilter('custrecord_ci_bill_to_customer',null,'anyof',custId));
		ciResults = nlapiSearchRecord('customrecord_contract_item','customsearch__contract_item_by_customer',ciFils);
		if (isNotEmpty(ciResults)){
			itemsfld.setDisplaySize(150,MyParseFloat(ciResults.length));
			for (var ci=0;ci<ciResults.length;ci++){
				var selcetitemId = ciResults[ci].getValue('custrecord_ci_item',null,'group');
				var selcetitemtxt = ciResults[ci].getText('custrecord_ci_item',null,'group');
				itemsfld.addSelectOption(selcetitemId,selcetitemtxt);
			}
		}
		
		//Add contract user Sublist
		var cusl = form.addSubList('cusl','list','Contract Users');
		cusl.addMarkAllButtons();
		cusl.addField('cusl_apply','checkbox','Apply');
		cusl.addField('cusl_cuid','textarea','Internal Id');
		cusl.addField('cusl_cuemail','textarea','Email');
		cusl.addField('cusl_cucontracts','textarea','Contracts');
		cusl.addField('cusl_cuitems','textarea','Items');
		
		//Get Contract users and add to sublist
		var cuFils = [];
		cuFils.push(new nlobjSearchFilter('custrecord_contractuser_customer',null,'anyof',custId));
		var curesults = nlapiSearchRecord('customrecord_contractuser','customsearch__contract_user_items_by_ema',cuFils);
		if (isNotEmpty(curesults)){
			var searchCols = curesults[0].getAllColumns(); 
			for(var cu=0;cu<curesults.length;cu++){
				var cuitemsArr = [];
				var cucontractsArr = [];
				var cuidsArr = [];
				var cuids = curesults[cu].getValue(searchCols[0]);
				cuids = cuids.split(',');
				for (var i in cuids){
					if (cuidsArr.indexOf(cuids[i])==-1)
						cuidsArr.push(cuids[i]);
				}	
				var cuemail = curesults[cu].getValue(searchCols[1]);
				var cucontracts = curesults[cu].getValue(searchCols[2]);
				cucontracts = cucontracts.split(',');
				for (var i in cucontracts){
					if (cucontractsArr.indexOf(cucontracts[i])==-1)
						cucontractsArr.push(cucontracts[i]);
				}
				var cuitems = curesults[cu].getValue(searchCols[3]);
				cuitems = cuitems.split(',');
				for (var i in cuitems){
					if (cuitemsArr.indexOf(cuitems[i])==-1)
						cuitemsArr.push(cuitems[i]);
				}
				cusl.setLineItemValue('cusl_cuid',cu+1,cuidsArr.toString());
				cusl.setLineItemValue('cusl_cuemail',cu+1,cuemail);
				cusl.setLineItemValue('cusl_cucontracts',cu+1,cucontractsArr.toString());
				cusl.setLineItemValue('cusl_cuitems',cu+1,cuitemsArr.toString());
			}
		}
		
		form.addSubmitButton('Submit');
		
		response.writePage(form);
	}
	else{
		//post
		var custId = request.getParameter('custid');
		var cuitems = request.getParameter('items');
			cuitems = cuitems.split(',');
		for(var i = 1; i <= request.getLineItemCount('cusl');i++){
			var cusl_apply = request.getLineItemValue('cusl','cusl_apply',i);
			if (cusl_apply == 'T'){
				var cusl_cuid = request.getLineItemValue('cusl','cusl_cuid',i);
				cusl_cuid = cusl_cuid.split(',');
				nlapiLogExecution('debug','cusl_cuid '+cusl_cuid);
				var cusl_cuemail = request.getLineItemValue('cusl','cusl_cuemail',i);
				var cusl_cucontracts = request.getLineItemValue('cusl','cusl_cucontracts',i);
				cusl_cucontracts = cusl_cucontracts.split(',');
				var cusl_cuitems = request.getLineItemValue('cusl','cusl_cuitems',i);
				cusl_cuitems = cusl_cuitems.split(',');
				//var createnewuser = false;
				//var newuserItems = [];
				var contractIds = [];
				for (var item in cuitems){
					// Find Contract for item selected
					var contractfils = [];
					contractfils.push(new nlobjSearchFilter('custrecord_ci_item','custrecord_ci_contract_id','is',cuitems[item]));
					contractfils.push(new nlobjSearchFilter('custrecord_contracts_bill_to_customer',null,'is',custId));
					var contractResults = nlapiSearchRecord('customrecord_contracts',null,contractfils);
					if (isNotEmpty(contractResults)){
						for(var c=0;c<contractResults.length;c++){
							var contractId = contractResults[c].getId();
							nlapiLogExecution('debug','contractId',contractId);
							contractIds.push(contractId);
						}
					}
					//find cuid with anyof contractIds
					var cuidFils = [];
					cuidFils.push(new nlobjSearchFilter('internalid',null,'anyof',cusl_cuid));
					cuidFils.push(new nlobjSearchFilter('custrecord_contractuser_contract',null,'anyof',contractIds));
					var cuidResults = nlapiSearchRecord('customrecord_contractuser',null,cuidFils);
					var itemsArr = [cuitems[item]];
					if (isNotEmpty(cuidResults)){
						var cuid = cuidResults[0].getId();
						nlapiLogExecution('debug','Search cuid',cuid);
						curec = nlapiLoadRecord('customrecord_contractuser',cuid);
						itemsArr = curec.getFieldValues('custrecord_contractuser_items').concat(itemsArr);
					}
					else{
						var cuflds = ['custrecord_contractuser_firstname','custrecord_contractuser_lastname'];
						var cuVals = nlapiLookupField('customrecord_contractuser',cusl_cuid,cuflds);
						var cuFirstName = cuVals['custrecord_contractuser_firstname'];
						var cuLastName = cuVals['custrecord_contractuser_lastname'];
						curec = nlapiCreateRecord('customrecord_contractuser');
						curec.setFieldValue('custrecord_contractuser_customer',custId);
						curec.setFieldValue('custrecord_contractuser_contract',contractIds[0]);
						curec.setFieldValue('custrecord_contractuser_firstname',cuFirstName);
						curec.setFieldValue('custrecord_contractuser_lastname',cuLastName);
						curec.setFieldValue('custrecord_contractuser_email',cusl_cuemail);
					}
						
					//itemsArr = curecitems.concat(cuitems[item]);
					nlapiLogExecution('debug','itemsArr',itemsArr);
					curec.setFieldValues('custrecord_contractuser_items',itemsArr);
					nlapiSubmitRecord(curec);
				}
			}
		}
		nlapiSetRedirectURL('RECORD','customer',custId);
	}
}

/*function ccerpSelect_CUitemsButton(){

    var cuid = nlapiGetRecordId();
    var customer = nlapiGetFieldValue('custrecord_contractuser_customer');
    var contractId = nlapiGetFieldValue('custrecord_contractuser_contract');
    
    var url = nlapiResolveURL('SUITELET', 'customscript_contractuserSelectItems', 'customdeploy1');
    url += '&cuid=' + meid;
    url += '&contractId=' + fetype;
   
    window.open(url, '', 'toolbar=yes, dependent=yes, location=yes, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=450, height=600');
    
}*/

function ccerp_CreateMultiContractIPusers_SCHED(){
	var err = new Object();
	nlapiLogExecution('debug','Sched Running');
	//return;
	var context = nlapiGetContext();
	var customerId = context.getSetting('SCRIPT', 'custscript_customerid');
	var contractARR = context.getSetting('SCRIPT', 'custscript_contractarr');
	var contactId = context.getSetting('SCRIPT', 'custscript_contactid');
	var datain = context.getSetting('SCRIPT', 'custscript_datainstr');
	nlapiLogExecution('debug','datain',datain);
	nlapiLogExecution('debug','contractARR',contractARR);
	
	contractARR = JSON.parse(contractARR);
	datain = JSON.parse(datain);
	
	for (var c in contractARR){
		nlapiLogExecution('debug','contractARR[c]',contractARR[c]);	
		nlapiLogExecution('debug','contractARR.length',contractARR.length);
		// search for contract items
		var items = [];
		var cifils = [];
		var cicols = [];
		cifils.push(new nlobjSearchFilter('custrecord_ci_contract_id',null,'is',contractARR[c]));
		cicols.push(new nlobjSearchColumn('custrecord_ci_item',null,'group'));
		cicols.push(new nlobjSearchColumn('type','custrecord_ci_item','group'));
		cicols.push(new nlobjSearchColumn('custrecord_contracts_end_user','custrecord_ci_contract_id','group'));
		cicols.push(new nlobjSearchColumn('custrecord_contracts_start_date','custrecord_ci_contract_id','group'));
		cicols.push(new nlobjSearchColumn('custrecord_contracts_end_date','custrecord_ci_contract_id','group'));
		var ciresults = nlapiSearchRecord('customrecord_contract_item','customsearch__contractitems_per_contract',cifils,cicols);
		if(isNotEmpty(ciresults)){
			nlapiLogExecution('debug','ciresults.length',ciresults.length);
			//var customer = ciresults[0].getValue('custrecord_contracts_end_user','custrecord_ci_contract_id','group');
			//var startdate = ciresults[0].getValue('custrecord_contracts_start_date','custrecord_ci_contract_id','group');
			//var enddate = ciresults[0].getValue('custrecord_contracts_end_date','custrecord_ci_contract_id','group');
			for(var i=0;i<ciresults.length;i++){
				var ci = ciresults[i].getValue('custrecord_ci_item',null,'group');
				//nlapiLogExecution('debug', 'postIpUsers_RESTlet', 'ci '+ci);
				
				if(items.indexOf(ci*1)==-1)
					items.push(ci);
				
			}
			nlapiLogExecution('debug', 'postIpUsers_RESTlet', 'items '+JSON.stringify(items));
			
			var record = '';
			// id must be a contract user record id
			if(datain.contractuserId)
				record = nlapiLoadRecord('customrecord_contractuser',datain.id);
			else
				record = nlapiCreateRecord('customrecord_contractuser');
			
			record.setFieldValue('custrecord_contractuser_contract',contractARR[c]);
			record.setFieldValue('custrecord_contractuser_email',datain.email);
			record.setFieldValue('custrecord_contractuser_contact',contactId);
			record.setFieldValue('custrecord_contractuser_firstname',datain.firstname);
			record.setFieldValue('custrecord_contractuser_lastname',datain.lastname);
			record.setFieldValue('custrecord_contractuser_customer',customerId);
			//record.setFieldValue('custrecord_contractuser_startdate',startdate);
			//record.setFieldValue('custrecord_contractuser_endate',enddate);
			record.setFieldValues('custrecord_contractuser_items',items);
			record.setFieldValue('custrecord_contractuser_activeflag','T');
			record.setFieldValue('custrecord_contractuser_callbackurl',datain.referer);
			
			var recordId = nlapiSubmitRecord(record);
			nlapiLogExecution('DEBUG', 'ccerp_CreateMultiContractIPusers_SCHED','record id ' + recordId);
			
		}
		
	}
}

function ta_redirect_user() {
	var webUserId = nlapiGetRecordId();
	var contactId = nlapiLookupField('customrecord_contractuser', webUserId, 'custrecord_contractuser_contact');
	if(isNotEmpty(contactId)){
		var url = nlapiResolveURL('RECORD', 'contact', contactId);
		url += '&e=T';
		window.open(url, '_self');
	}
}


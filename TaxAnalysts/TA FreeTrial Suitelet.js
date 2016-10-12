/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Aug 2015     Chan
 *
 */


/*******************************
// Free Trial Suitelet //
*****************************/
function ta_freetrialSuitelet(request, response) {
	var custId = request.getParameter('custId');
	var fileId = request.getParameter('fileId');
	if(request.getMethod() == 'GET'){
		var form = nlapiCreateForm('Free Trial Management');
		form.setScript('customscript_ta_freetrial_client_2');
		form.addSubTab('new_user_tab', 'Add New User(s)');
		form.addSubTab('existing_user_tab', 'Apply to Existing User(s)');
		// function to build itemlist
		function loadAllItemList() {
			var filters = new Array();
			var itemListLen = 0;
		    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
		    filters.push(new nlobjSearchFilter('itemid', null, 'doesnotstartwith', 'ip'));
		    filters.push(new nlobjSearchFilter('custitem_ta_isonline', null, 'is', 'T'));
		    filters.push(new nlobjSearchFilter('itemid', null, 'doesnotcontain', 'custom'));			
		    var columns = new Array();
		    columns.push(new nlobjSearchColumn('itemid', null, null));
		    var searchresults = nlapiSearchRecord('item', null, filters, columns);
		    if(isNotEmpty(searchresults)){
		    	for (var i = 0; i < searchresults.length; i++){
		    		itemSelect.addSelectOption(searchresults[i].getId(), searchresults[i].getValue('itemid'));
		    		itemListLen++;
		     		//ftUserslItemFld.addSelectOption(searchresults[i].getId(), searchresults[i].getValue('itemid'));
		    	}
		    	return itemListLen;
		    }
			
		}
		// function to return list of current subscription of the customer
		function contractItemSearch(customerId) {
			var searchFilter = [];
			var searchColumn = [];
			var itemList = "";
			var recType = "customrecord_contract_item";
			searchFilter.push(new nlobjSearchFilter('custrecord_ci_enddate', null, 'after', null,'today' ));
			searchFilter.push(new nlobjSearchFilter('custrecord_ci_bill_to_customer', null, 'is', customerId));
			searchColumn.push(new nlobjSearchColumn('custrecord_ci_item', null, null));
			var searchResult = nlapiSearchRecord(recType, null, searchFilter, searchColumn);
			if(isNotEmpty(searchResult)){
				for(var i = 0; i < searchResult.length; i++){
					itemList += searchResult[i].getText('custrecord_ci_item');
					itemList += "\n";
				}
				return itemList;
			}
		}	
		
		var customerId = form.addField('custid', 'text', 'Customer ID');
		customerId.setDefaultValue(custId);
		customerId.setDisplayType('disabled');
		customerId.setLayoutType('startrow', 'startcol');
		// file upload
		form.addField('csv_file', 'file', 'Upload your own CSV file (optional). ');
		
		var csv_down_fld = form.addField('csv_download', 'url');
		var tempFileObj = nlapiLoadFile('469896');
		var tempFileUrl = tempFileObj.getURL();
		
		csv_down_fld.setDisplayType('inline').setLinkText('Click Here to Download CSV Template').setDefaultValue('https://system.netsuite.com'+tempFileUrl)
		
		var startdate = form.addField('startdate', 'date', 'Trial Start Date');
		var enddate = form.addField('enddate', 'date', 'Trial End Date');
		enddate.setMandatory(true);
		//startdate.setMandatory(true);
		//enddate.setMandatory(true);
		
		startdate.setDisplaySize(50).setPadding(3);
		enddate.setDisplaySize(50);
		
		var curContItms = contractItemSearch(custId);
		if(isNotEmpty(curContItms)){
			var currentItemList = form.addField('current_items', 'longtext', 'Active Subscription(s)');
			currentItemList.setPadding(2).setDisplayType('inline');
			currentItemList.setDisplaySize(30,curContItms.split('\n').length);
			currentItemList.setDefaultValue(curContItms);
		}
		
		// adding mid row for item select 
		var itemSelect = form.addField('item_select', 'multiselect', 'Choose Item(s) to Add as Free Trial (Ctrl + click to multi-select)');
		var itemListLength = loadAllItemList();
		//itemSelect.setMandatory(true);
		if(isNotEmpty(curContItms)){
			itemSelect.setLayoutType('midrow', 'startcol').setDisplaySize(200, 20);
		}else{
			itemSelect.setLayoutType('midrow', 'startcol').setDisplaySize(200, 10);
		// add SubTabs and add filter(field) for existing user sublist and new freetrial sublist 
		}
		// adding sublist and loading all active webusers 
		var webuserSubList = form.addSubList('webuser', 'list', 'Existing Users to Apply Free Trial','existing_user_tab');
		webuserSubList.addMarkAllButtons();

		webuserSubList.addField('webuser_apply', 'checkbox', 'Apply');
		webuserSubList.addField('webuser_email', 'email', 'Email');
		webuserSubList.addField('webuser_firstname', 'text', 'First Name');
		webuserSubList.addField('webuser_lastname', 'text', 'Last Name');
		webuserSubList.addField('webuser_items', 'textarea', 'Items');
		//webuserSubList.addField('webuser_contact_id', 'text', 'Contact ID');
		
		// add sublist with inlineeditor type to add new freetrial user
		var newWebUser = form.addSubList('new_webuser', 'inlineeditor', 'Add New Free Trial Users', 'new_user_tab');
		

		var new_webuser_email_fld = newWebUser.addField('new_webuser_email', 'email', 'Email');
		var new_webuser_firstname_fld = newWebUser.addField('new_webuser_firstname', 'text', 'First Name');
		var new_webuser_lastname_fld = newWebUser.addField('new_webuser_lastname', 'text', 'Last Name');
		newWebUser.setUniqueField('new_webuser_email');
		new_webuser_email_fld.setMandatory(true);
		new_webuser_firstname_fld.setMandatory(true);
		new_webuser_lastname_fld.setMandatory(true);
		// adding all active web user to sublist
		
		var webUserFilter = new Array();
		webUserFilter.push(new nlobjSearchFilter('custrecord_contractuser_customer', null, 'is' , custId));
		//webUserFilter.push(new nlobjSearchFilter('custrecord_contractuser_freetrial', null, 'is', 'F'));
		var webUserSearchResults = nlapiSearchRecord(null, 'customsearch__add_freetrial_sublist', webUserFilter);
		if(isNotEmpty(webUserSearchResults)){
			
			for(var i = 0; i < webUserSearchResults.length; i++){

				webuserSubList.setLineItemValue('webuser_email', i+1, webUserSearchResults[i].getValue('custrecord_contractuser_email', null, 'group'));
				webuserSubList.setLineItemValue('webuser_firstname', i+1, webUserSearchResults[i].getValue('custrecord_contractuser_firstname', null, 'group'));
				webuserSubList.setLineItemValue('webuser_lastname', i+1, webUserSearchResults[i].getValue('custrecord_contractuser_lastname', null, 'group'));
				webuserSubList.setLineItemValue('webuser_items', i+1, webUserSearchResults[i].getValue('formulatext', null, 'max'));
				
			}
		}
		
		// if parameter has fileId  
		if(isNotEmpty(fileId)){
			var primaryFile = nlapiLoadFile(fileId);
			var fileContent = primaryFile.getValue();
			var splitLine = fileContent.trim().split("\n");
			
			for(var lines = 1; lines < splitLine.length; lines++){
				var words = splitLine[lines].split(",");
				for(var word = 0; word < words.length; word++){
					if(word == 0){
						newWebUser.setLineItemValue('new_webuser_email', lines, words[0]);
					}else if(word == 1){
						newWebUser.setLineItemValue('new_webuser_firstname', lines, words[1]);
					}else if(word == 2){
						newWebUser.setLineItemValue('new_webuser_lastname', lines, words[2]);
					}	
				} 
			}
		}

		
		
		
		form.addSubmitButton('Submit');
		form.addResetButton('Reset Form');
		
		response.writePage(form);
	}
	else {
		var file = request.getFile('csv_file');
		var custId = request.getParameter('custid');
		if(isNotEmpty(file)){
			file.setFolder('447246');
			var fileId = nlapiSubmitFile(file);
			if(isNotEmpty(fileId)){
				var parameters = [];
				parameters['fileId'] = fileId;
				parameters['custId'] = custId;
				nlapiSetRedirectURL('SUITELET', 'customscript_ta_freetrial_suitelet', 'customdeploy1', false, parameters);
			}
			
		}else{
			nlapiLogExecution('DEBUG', 'POST', 'POST Begins..')
			var items = request.getParameterValues('item_select');
			var startdateParam = request.getParameter('startdate');
			var enddateParam = request.getParameter('enddate');
			// building webuser object
			var webUserObj = new Object();
			var webUserLen = request.getLineItemCount('webuser');
			var newWebUserLen = request.getLineItemCount('new_webuser');
			var userEmail = [];
			var userFirstName = [];
			var userLastName = [];
			
			
			for(var i = 0; i < webUserLen; i++){
				if(request.getLineItemValue('webuser', 'webuser_apply', i+1) == 'T'){
					userEmail.push(request.getLineItemValue('webuser','webuser_email',i+1));
					userFirstName.push(request.getLineItemValue('webuser','webuser_firstname',i+1));
					userLastName.push(request.getLineItemValue('webuser','webuser_lastname',i+1));
				}
			}
			
			if(newWebUserLen > 0) {
				for(var i = 1; i <= newWebUserLen; i++){
					userEmail.push(request.getLineItemValue('new_webuser', 'new_webuser_email', i));
					userFirstName.push(request.getLineItemValue('new_webuser', 'new_webuser_firstname', i));
					userLastName.push(request.getLineItemValue('new_webuser', 'new_webuser_lastname', i));
				}
			}
			webUserObj.customerId = custId;
			webUserObj.items = items;
			webUserObj.email = userEmail;
			webUserObj.firstname = userFirstName;
			webUserObj.lastname = userLastName;
			webUserObj.enddate = enddateParam;
			webUserObj.startdate = startdateParam;
			nlapiLogExecution('DEBUG', 'POST - webUserObj', JSON.stringify(webUserObj));
			nlapiLogExecution('DEBUG', 'POST - items', items);
			
			var schedParams = [];
			schedParams['custscriptwebuserobj'] = JSON.stringify(webUserObj);
			// Pass parameters to Scheduled Script
			// 1st parameter - customer id 
			// 2nd parameter - items array
			// 3rd parameter - customer list in obj
			
			nlapiScheduleScript('customscript_ta_freetial_sched', 'customdeploy1', schedParams);
			var redirectParams = [];
			redirectParams['primarykey']='953';
			redirectParams['date']='TODAY';
			redirectParams['scripttype']='205';
			nlapiSetRedirectURL('TASKLINK','LIST_SCRIPTSTATUS',null,null,redirectParams);
		}
	}
}

function ta_FreeTrialSCHED() {
	var context = nlapiGetContext();
	var webUserObj = context.getSetting('SCRIPT', 'custscriptwebuserobj');
	webUserObj = JSON.parse(webUserObj);
	nlapiLogExecution('DEBUG', 'webUserObj', JSON.stringify(webUserObj));
	if(isNotEmpty(webUserObj)){
		var emails = webUserObj["email"];
		var firstnames = webUserObj["firstname"];
		var lastnames = webUserObj["lastname"];
		var custId = webUserObj["customerId"];
		var items = webUserObj["items"];
		var startdate = webUserObj["startdate"];
		var enddate = webUserObj["enddate"];
		for(var i = 0; i < emails.length; i++){
			try{
				var newWebUserRec = nlapiCreateRecord('customrecord_contractuser');
				newWebUserRec.setFieldValue('custrecord_contractuser_customer', custId);
				newWebUserRec.setFieldValue('custrecord_contractuser_email', emails[i]);
				newWebUserRec.setFieldValue('custrecord_contractuser_firstname', firstnames[i]);
				newWebUserRec.setFieldValue('custrecord_contractuser_lastname', lastnames[i]);
				newWebUserRec.setFieldValue('custrecord_contractuser_items', items);
				newWebUserRec.setFieldValue('custrecord_contractuser_freetrial', 'T');
				newWebUserRec.setFieldValue('custrecord_contractuser_activeflag', 'T');
				newWebUserRec.setFieldValue('custrecord_contractuser_startdate', startdate);
				newWebUserRec.setFieldValue('custrecord_contractuser_endate', enddate);
				var newWebUserId = nlapiSubmitRecord(newWebUserRec);
				nlapiLogExecution('DEBUG', 'New Record Customer ID', custId);
				nlapiLogExecution('DEBUG', 'New Record Processed', 'Web User ID = ' + newWebUserId);
			}
			catch(e){
				nlapiLogExecution('ERROR', 'Errors in creating user', e);
			}
		}
	}
	
}


/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Mar 2015     Dana
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */


function ccerpCreateCreditCard_RESTlet(dataIn) {
	//https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=191&deploy=1
	nlapiLogExecution('debug', 'ccerpCreateCreditCard_RESTlet', 'BEGIN');
	//dataIn = JSON.parse(dataIn);
	//nlapiLogExecution('debug', 'datain', dataIn);
	// Creating err object
	//var err = new Object();
	// Enable debugging Log Execution
	
	/*
	 * JSON object
	 * {
		"nsuserid" : "value",
		"creditcard" : "value",
		"ccname" : "value",
		"cctype" : "value",
		"ccnumber" : "value",
		"ccexpiredate" : "mm/yyyy",
		"ccsecuritycode" : "value",
		"ccstreet" : "value",
		"cccity" : "value",
		"ccstate" : "value",
		"cczip" : "value"
		}
	 */
	//var creditcard = dataIn.creditcard;
	var cuid = dataIn.nsuserid;
	var ccname = dataIn.ccname;
	var cctype = dataIn.cctype;
	var ccnumber = dataIn.ccnumber;
	var ccexpiredate = dataIn.ccexpiredate;
	var ccstreet = dataIn.ccstreet;
	var cccity = dataIn.cccity;
	var ccstate = dataIn.ccstate;
	var cczip = dataIn.cczip;
	
	
		var ccInfo = [];
		nlapiLogExecution('debug','cuid ',cuid);
		var cuidFlds = ['custrecord_contractuser_chargecustomer','custrecord_contractuser_email','custrecord_contractuser_firstname','custrecord_contractuser_lastname'];
		var cuidVals = nlapiLookupField('customrecord_contractuser',cuid,cuidFlds);
		var chargecust = cuidVals['custrecord_contractuser_chargecustomer'];
		var firstname = cuidVals['custrecord_contractuser_firstname'];
		var lastname = cuidVals['custrecord_contractuser_lastname'];
		var email = cuidVals['custrecord_contractuser_email'];
		nlapiLogExecution('debug','60 chargecust ',chargecust);
		var custrec = '';

		if (isEmpty(chargecust)){
			//Search for web user with same email and charge to customer isNotEmpty
			var cuFlds = ['custrecord_contractuser_email','custrecord_contractuser_customer'];
			var cuVals = nlapiLookupField('customrecord_contractuser',cuid,cuFlds);
			var email = cuVals['custrecord_contractuser_email'];
			var cuCustomer = cuVals['custrecord_contractuser_customer'];
			var cuFils = [];
			var cuCols = [];
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_email',null,'is',email));
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_chargecustomer',null,'noneof','@NONE@'));
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_activeflag',null,'is','T'));
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_customer',null,'is',cuCustomer));
			cuCols.push(new nlobjSearchColumn('custrecord_contractuser_chargecustomer'));
			var curesults = nlapiSearchRecord('customrecord_contractuser',null,cuFils,cuCols);
			if (isNotEmpty(curesults)){
				chargecust = curesults[0].getValue('custrecord_contractuser_chargecustomer');
				cuid = curesults[0].getId();
			}
		}
		nlapiLogExecution('debug','82 chargecust ',chargecust);
		if (isNotEmpty(chargecust))
			custrec = nlapiLoadRecord('customer',chargecust,{recordmode: 'dynamic'});
		else{	
			custrec = nlapiCreateRecord('customer',{recordmode: 'dynamic'});
			custrec.setFieldValue('isperson','T');
			custrec.setFieldValue('email',email);
			custrec.setFieldValue('firstname',firstname);
			custrec.setFieldValue('lastname',lastname);
		}
		if (isNotEmpty(ccnumber)){
			var credit_card_line_num = nlapiGetLineItemCount('creditcards');
			nlapiLogExecution('DEBUG', 'Credit Card Line Num', credit_card_line_num);
			for (var i = 1; i <= credit_card_line_num; i++){
				custrec.removeLineItem('creditcards', i);
			}
			custrec.selectLineItem('creditcards', 1);
			custrec.setCurrentLineItemValue('creditcards','ccname',ccname);
			custrec.setCurrentLineItemValue('creditcards','ccnumber',ccnumber);
			custrec.setCurrentLineItemValue('creditcards','ccexpiredate',ccexpiredate);
			custrec.setCurrentLineItemValue('creditcards','paymentmethod',cctype);
			custrec.commitLineItem('creditcards');
		}
		var subrec = '';
		var billLsn = custrec.findLineItemValue('addressbook','defaultbilling','T');
		nlapiLogExecution('debug','billLsn '+billLsn);
		if (billLsn > -1){
			custrec.selectLineItem('addressbook',billLsn);
			subrec = custrec.editCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
		}
		else{
			custrec.selectNewLineItem('addressbook');
			custrec.setCurrentLineItemValue('addressbook','defaultbilling','T');
			subrec = custrec.createCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
		}
		subrec.setFieldText('country', 'United States');
		subrec.setFieldValue('addr1',ccstreet);
		subrec.setFieldValue('city',cccity);
		subrec.setFieldValue('state',ccstate);
		subrec.setFieldValue('zip',cczip);
		subrec.commit();	
		custrec.commitLineItem('addressbook');
		
		//Get the Id of the CC to pass to drupal
		var cccustuid = nlapiSubmitRecord(custrec);
		if (isEmpty(chargecust))
			nlapiSubmitField('customrecord_contractuser',cuid,'custrecord_contractuser_chargecustomer',cccustuid);
		var cccustrec = nlapiLoadRecord('customer',cccustuid);
		var ccline = cccustrec.getLineItemCount('creditcards'); 
		var ccid = cccustrec.getLineItemValue('creditcards','internalid',ccline);
		ccInfo.push({
			"nsuserid" : cuid,
			"creditcardId" : ccid
		});
		
		var ccInfoJson = JSON.stringify(ccInfo);
		nlapiLogExecution('debug','ccInfoJson',ccInfoJson);	
		return ccInfoJson;
	
}
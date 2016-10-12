/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Jun 2014     CCERP
 *
 */

function ccerp_PrintMailingLabelsOrig(request,response){
	// customscript_ccerp_printmailinglabelsori
	
	var context = nlapiGetContext();
	if(request.getMethod() == 'GET'){
		var form = nlapiCreateForm('Print Mailing Labels');
		form.setScript('customscript_ccerp_printmailinglabels_cl');
		form.addSubmitButton('Preview Labels');
		var itemsfld = form.addField('items','multiselect','Items');
		var itemresults = nlapiSearchRecord(null,'customsearch__mailing_label_items');
		if(isNotEmpty(itemresults)){
			for(var i=0;i<itemresults.length;i++)
				itemsfld.addSelectOption(itemresults[i].getId(),itemresults[i].getValue('name'));
			itemsfld.setDisplaySize(200, itemresults.length*1.25);
		}
		form.addField('date','date','Date').setMandatory(true);	
		form.addField('deliverytype','select','Delivery Type','customlist_ccerp_deliverytypes')
		.setDefaultValue(1);
		
		
		
		
		response.writePage(form);
	}
	else{
		var items = request.getParameterValues('items');
		var deliverytype = request.getParameter('deliverytype');
		var date = request.getParameter('date');
		nlapiLogExecution('debug', 'ccerp_PrintMailingLabels','items '+JSON.stringify(items)+' items.length '+items.length+' deliverytype '+deliverytype+' date '+date);
		var noresults = true;
		var labellines = [];
		var custids = [];
		var uniquecustids = [];
		
		var mlfils = [];
		mlfils.push(new nlobjSearchFilter('custrecord_ci_item',null,'anyof',items));
		
		if(isNotEmpty(date)){
			mlfils.push(new nlobjSearchFilter('custrecord_ci_startdate',null,'onorbefore',date));
			mlfils.push(new nlobjSearchFilter('custrecord_ci_enddate',null,'onorafter',date));
		}
			
		// Resolve delivery type
		var handdeliverytypes = ['2','3','4'];
		var handdelivery = 'F';
		if(handdeliverytypes.indexOf(deliverytype)>-1){
			handdelivery = 'T';
			switch(deliverytype){
			case '2':
				mlfils.push(new nlobjSearchFilter('state','custrecord_ci_bill_to_customer','anyof','NY')); // 32 NY
				break;
			case '3':
				mlfils.push(new nlobjSearchFilter('state','custrecord_ci_bill_to_customer','anyof','DC')); // 8 DC
				break;
			case '4':
				mlfils.push(new nlobjSearchFilter('state','custrecord_ci_bill_to_customer','noneof',['NY','DC']));
				break;
			}
		}
		nlapiLogExecution('debug', 'ccerp_PrintMailingLabels','handdelivery '+handdelivery);
		mlfils.push(new nlobjSearchFilter('custrecord_ci_handdelivery',null,'is',handdelivery));
		
		var mlresults = nlapiSearchRecord(null,'customsearch__mailing_labels',mlfils);
		// Set field for initializing prevcustid; used to determine when custid changes
		var custid = '';
		var prevcustid = '';
		if(isNotEmpty(mlresults)){
			nlapiLogExecution('debug', 'mlresults.length '+mlresults.length);
			noresults = false;
			// Populate data into objects
			for(var i=0;i<mlresults.length;i++){
				//nlapiLogExecution('debug','i '+i+' custid '+custid);
				custid = mlresults[i].getValue('custrecord_ci_bill_to_customer',null,'group');
				var completecustid = true;
				if (custid != prevcustid){
					// WHEN THERE ARE 1000 SEARCHRESULTS
					// Before adding a new header line, we must make sure all contract lines for this custid are
					// contained in the searchresults. This is necessary for when there are 1000+ searchresults.
					// When we reach the end of the results we will search again using the current custid as
					// a greaterthan criteria in the search. If we don't have the entire custid in the original
					// search then we will be excluding some rows when we run the subsequent search with the 
					// greaterthan cabbuild filter.
					if(mlresults.length==1000){
						completecustid = false;
						for(var c = i + 1;c<mlresults.length;c++){
							var checkcustid = mlresults[c].getValue('custrecord_ci_bill_to_customer',null,'group');
							if(custid==checkcustid)
								continue;
							else{
								completecustid = true;
								break;
							}
						}
					}
				}
				
				if(completecustid == true){
					var item = nlapiEscapeXML(mlresults[i].getText('custrecord_ci_item',null,'group'));
					var qty = mlresults[i].getValue('custrecord_ci_quantity',null,'sum');
					var desc = nlapiEscapeXML(mlresults[i].getValue('description','custrecord_ci_item','group'));
					var address = formatAddress(nlapiEscapeXML(mlresults[i].getValue('shipaddress','custrecord_ci_bill_to_customer','group')));
					var customerTxt = mlresults[i].getText('custrecord_ci_bill_to_customer',null,'group');
					var zip = mlresults[i].getValue('shipzip','custrecord_ci_bill_to_customer','group');
					if(isNotEmpty(zip))
						zip = zip.replace(/\D/g,''); // remove non numerics (postnet barcode requirement)
					if(uniquecustids.indexOf(custid)==-1){
						custids.push({
							'custid' : custid,
							'address' : address,
							'zip' : zip,
							'customerTxt':customerTxt
						});
						uniquecustids.push(custid);
					}
					
					labellines.push({
						'custid' : custid,
						'item' : item,
						'qty' : qty,
						'desc' : desc
					});
					prevcustid = custid;
	            }
	            else{
	            	var mlfils = [];
	        		mlfils.push(new nlobjSearchFilter('custrecord_ci_item',null,'anyof',items));
	        		if(isNotEmpty(date)){
	        			mlfils.push(new nlobjSearchFilter('custrecord_ci_startdate',null,'onorbefore',date));
	        			mlfils.push(new nlobjSearchFilter('custrecord_ci_enddate',null,'onorafter',date));
	        		}
	        		mlfils.push(new nlobjSearchFilter('custrecord_ci_handdelivery',null,'is',handdelivery));
					mlfils.push(new nlobjSearchFilter('internalidnumber', 'custrecord_ci_bill_to_customer', 'greaterthan', prevcustid));
					var mlresults = nlapiSearchRecord(null,'customsearch__mailing_labels',mlfils);
					if(isNotEmpty(mlresults))
						i = -1;
					else
						break;
				}
			}
		}
		
		if(noresults==true)
			throw nlapiCreateError('ERROR','There are no lables to print',true);
			
		// START BUILDING XML
		
		// BUILD UP CSS
	    var css = '<style type="text/css">';
	    css += 'table {table-layout:fixed;width:100%;line-height:100%;}';
	    css += 'table.header {padding-top:-10px;}';
	    css += 'td.header {font-size:12pt;padding:.2cm 0 0 .2cm;border:0px solid black;}';
	    css += 'td.header-right {border:0px solid black;}';
	    css += 'td.header-right-split-left {border:0px solid black;}';
	    css += 'td.header-right-split-right {border:0px solid black;}';
	    css += 'td.delinstr {padding-top:.5cm;border:0px solid black;}';
	    css += 'p {text-align:left;}';
	    css += 'p.right {text-align:right;}';
	    css += 'td.middle {font-size:10pt;border:0px solid black;}';
	    css += 'table.footer {padding-top:.5cm;}';
	    css += 'table.middle {padding-top:.6cm;}';
	    css += 'td.footer {font-size:10pt;}';
	    css += 'th {font-weight:bold;text-decoration:none;border-bottom: 1px;padding:0 0 3px 0;}';
	    css += 'td {padding:10px 0 0 0;}';
	    css += '.address {margin:0 0 0 375px;font-size:12pt;}';
	    css += '.tdheader {border:0px solid black;}';
	    css += '.sectionhdr {font-size:18px;font-weight:bold;}';
	    css += '</style>';
	    
		// BUILD UP HEADER TABLE
	    var header = '<macro id="myheader">';
	    header += '<table style="margin:60px 50px 0 0;">';
	    
	    header += '<tr>';
	    header += '<td class="tdheader" align="left">';
	    header += '<img style="height:29;width:160;" src="' + ccerpGetLogoURL() + '" />';
	    header += '</td>';
	    //header += '<td class="tdheader" align="right" valign="bottom">Page <pagenumber/> of <totalpages/></td>';
	    header += '<td class="tdheader sectionhdr" align="right">';
	    header += 'PACKING SLIP';
	    header += '</td>';
	    header += '</tr>';
	    
	    header += '<tr>';
	    header += '<td class="tdheader" align="left">';
	    header += ccerpGetCompanyAddress();
	    header += '</td>';
	    header += '<td class="tdheader" align="right">';
	    header += nlapiDateToString(new Date());
	    header += '</td>';
	    header += '</tr>';
	    
	    header += '</table>';
	    header += '</macro>';
	    
	    
	    // BUILD UP FOOTER TABLE
	    var footer = '';
	    
	    for(var c in custids){
	    	footer += '<macro id="'+custids[c].custid+'">';
	    	if(isNotEmpty(custids[c].zip))
	    		footer += '<p class="address"><barcode codetype="postnet" showtext="false" value="'+custids[c].zip+'"/></p>';
	    	footer += '<p class="address">'+custids[c].address+'</p>';
	    	footer += '<p width="225" border="0" align="left"><b>Customer:</b> '+nlapiEscapeXML(custids[c].customerTxt)+'</p>';
	    	footer += '</macro>';
	    }
	    
	    // ADD MACROLIST
	    var macrolist = '<macrolist>';
	    macrolist += header;
	    macrolist += footer;
	    macrolist += '</macrolist>';
	    
	    // BUILD UP XML
	    var xml = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
	    xml += '<pdf>';
	    xml += '<head>';
	    xml += css;
	    xml += macrolist;
	    xml += '</head>';
	    xml += '<body header="myheader" header-height="6cm" footer="'+custids[0].custid+'" footer-height="8cm" margin="-.5in -.5in -.5in 0in" font-size="10pt" width="8.5in" height="11in" font-family="Helvetica" background-color="white" color="black">';
	    
		
		// For each custid create label object and Fetch XML
		for(var c in custids){
			// get header data
			var custid = custids[c].custid;
			var address = custids[c].address;
			var label = {};
			label.custid = custid;
			label.address = address;
			
			
			// get items data for this custid
			var items = [];
			for(var l in labellines){
				if(labellines[l].custid == custid){
					items.push({
						'item' : labellines[l].item,
						'qty' : labellines[l].qty,
						'desc' : labellines[l].desc
					});
				}
			}
			
			label.items = items;
			//nlapiLogExecution('debug', 'ccerp_PrintMailingLabels', JSON.stringify(label));
			
			if(c>0){
				/*var footer = '<macro id="footer">';
				footer += '<p class="address">'+address+'</p>';
			    footer += '</macro>';*/
			    xml += '<pbr footer="'+custid+'" footer-height="8cm" />';
			}
			xml += ccerp_PrintMailingLabels_GetXML(label);
		}
		
		// Close Body and PDF
		xml += '</body></pdf>';
		
		var usageRemaining = parseFloat(context.getRemainingUsage());
		nlapiLogExecution('debug', 'usageRemaining '+usageRemaining);
		
		// For testing only - create XML file for review
			/*var newFile = nlapiCreateFile('xml.xml', 'XMLDOC', xml);
			newFile.setFolder(-15); // SuiteScripts Folder
			newFile.setEncoding('UTF-8');
			nlapiSubmitFile(newFile);*/
		
		var file = nlapiXMLToPDF(xml);
		var ext = 'pdf';
	    var fileName = 'mailing' + '_' + TimeStampSuffix() + '.' + ext;
		file.setName(fileName);
		response.setContentType('PDF', fileName, 'inline');
    	response.write(file.getValue());
	}
}


function ccerp_PrintMailingLabels(request,response){
	// customscript_ccerp_printmailinglabels
	// this is for STN, TXN, TNI, and HD products only
	var context = nlapiGetContext();
	if(request.getMethod() == 'GET'){
		var form = nlapiCreateForm('Print Mailing Labels STN, TXN, TNI, HD Products Only');
		form.setScript('customscript_ccerp_printmailinglabels_cl');
		form.addSubmitButton('Preview Labels');
		var itemsfld = form.addField('items','multiselect','Items');
		var itemresults = nlapiSearchRecord(null,'customsearch__mailing_label_items');
		if(isNotEmpty(itemresults)){
			for(var i=0;i<itemresults.length;i++)
				itemsfld.addSelectOption(itemresults[i].getId(),itemresults[i].getValue('name'));
			itemsfld.setDisplaySize(200, itemresults.length*1.25);
		}
		itemsfld.setDefaultValue(['817','12','1121','1020']);
		itemsfld.setDisplayType('disabled');
		form.addField('date','date','Date').setMandatory(true);	
		form.addField('deliverytype','select','Delivery Type','customlist_ccerp_deliverytypes')
		.setDefaultValue(1);
		
		
		
		
		response.writePage(form);
	}
	else{
		var items = request.getParameterValues('items');
		var deliverytype = request.getParameter('deliverytype');
		var date = request.getParameter('date');
		nlapiLogExecution('debug', 'ccerp_PrintMailingLabels','items '+JSON.stringify(items)+' items.length '+items.length+' deliverytype '+deliverytype+' date '+date);
		var noresults = true;
		var labellines = [];
		var custids = [];
		var prodstrings = [];
		var uniquecustids = [];
		
		var mlfils = [];
		mlfils.push(new nlobjSearchFilter('custrecord_ci_item',null,'anyof',items));
		
		if(isNotEmpty(date)){
			mlfils.push(new nlobjSearchFilter('custrecord_ci_startdate',null,'onorbefore',date));
			mlfils.push(new nlobjSearchFilter('custrecord_ci_enddate',null,'onorafter',date));
		}
			
		// Resolve delivery type
		var handdeliverytypes = ['2','3','4'];
		var handdelivery = 'F';
		if(handdeliverytypes.indexOf(deliverytype)>-1){
			handdelivery = 'T';
			switch(deliverytype){
			case '2':
				mlfils.push(new nlobjSearchFilter('state','custrecord_ci_bill_to_customer','anyof','NY')); // 32 NY
				break;
			case '3':
				mlfils.push(new nlobjSearchFilter('state','custrecord_ci_bill_to_customer','anyof','DC')); // 8 DC
				break;
			case '4':
				mlfils.push(new nlobjSearchFilter('state','custrecord_ci_bill_to_customer','noneof',['NY','DC']));
				break;
			}
		}
		nlapiLogExecution('debug', 'ccerp_PrintMailingLabels','handdelivery '+handdelivery);
		mlfils.push(new nlobjSearchFilter('custrecord_ci_handdelivery',null,'is',handdelivery));
		
		//var mlresults = nlapiSearchRecord(null,'customsearch__mailing_labels',mlfils);
		var mlresults = nlapiSearchRecord(null,'customsearch__mailing_labels_item_qty',mlfils);
		
		
		
		// Set field for initializing prevcustid; used to determine when custid changes
		var custid = '';
		var prevcustid = '';
		if(isNotEmpty(mlresults)){
			nlapiLogExecution('debug', 'mlresults.length '+mlresults.length);
			noresults = false;
			// Populate data into objects
			
			
			// set up reference array of item, itemid, salesdescription
			var iteminfo = ccerpGetItemInfoJSON([817,12,1121,1020]);
			nlapiLogExecution('debug','JSON.stringify(iteminfo)',JSON.stringify(iteminfo));
			
			for(var i=0;i<mlresults.length;i++){
				
				var myqty = mlresults[i].getValue('custrecord_ci_quantity',null,'sum');
				nlapiLogExecution('debug','myqty '+myqty);
				
				var custid = mlresults[i].getValue('custrecord_ci_bill_to_customer',null,'group');
				var completecustid = true;
				if (custid != prevcustid){
					// WHEN THERE ARE 1000 SEARCHRESULTS
					// Before adding a new header line, we must make sure all contract lines for this custid are
					// contained in the searchresults. This is necessary for when there are 1000+ searchresults.
					// When we reach the end of the results we will search again using the current custid as
					// a greaterthan criteria in the search. If we don't have the entire custid in the original
					// search then we will be excluding some rows when we run the subsequent search with the 
					// greaterthan cabbuild filter.
					if(mlresults.length==1000){
						completecustid = false;
						for(var c = i + 1;c<mlresults.length;c++){
							var checkcustid = mlresults[c].getValue('custrecord_ci_bill_to_customer');
							if(custid==checkcustid)
								continue;
							else{
								completecustid = true;
								break;
							}
						}
					}
				}
				
				if(completecustid == true){
					
					var address = formatAddress(nlapiEscapeXML(mlresults[i].getValue('shipaddress','custrecord_ci_bill_to_customer','group')));
					var customerTxt = mlresults[i].getText('custrecord_ci_bill_to_customer',null,'group');
					var entityid = mlresults[i].getValue('entityid','custrecord_ci_bill_to_customer','group');
					var zip = mlresults[i].getValue('shipzip','custrecord_ci_bill_to_customer','group');
					if(isNotEmpty(zip))
						zip = zip.replace(/\D/g,''); // remove non numerics (postnet barcode requirement)
					
					if(uniquecustids.indexOf(custid)==-1){
						custids.push({
							'custid' : custid,
							'address' : address,
							'zip' : zip,
							'customerTxt':customerTxt,
							'entityid':entityid
						});
						uniquecustids.push(custid);
					}
					
					LogColumns(mlresults[i]);
					//var qty = MyParseFloat(mlresults[i].getValue('custrecord_ci_quantity',null,'sum'));
					var prodstr = entityid;
					var cols = mlresults[i].getAllColumns();
					cols.forEach(function(c) {
						var item = '', desc = ''; itemid = '';
						var qty = 0; var qtySTN = 0; var qtyTXN = 0; var qtyTNI = 0; var qtyHD = 0;
						if (c.getLabel()) {
							//nlapiLogExecution('debug', 'ccerp_PrintMailingLabels','c.getLabel() '+c.getLabel());
							if(c.getLabel()=='STN'){
								thisqty = MyParseFloat(mlresults[i].getValue(c));
								nlapiLogExecution('debug', 'STN thisqty '+thisqty);
								if(thisqty>0){
									item = 817; // STN
									qty = thisqty;
									if(qty>0)
										prodstr += ' | STN-'+qty;
								}
							}
							else if(c.getLabel()=='TXN'){
								thisqty = MyParseFloat(mlresults[i].getValue(c));
								if(thisqty>0){
									item = 12; // TXN
									qty = thisqty;
									if(qty>0)
										prodstr += ' | TXN-'+qty;
								}
							}
							else if(c.getLabel()=='TNI'){
								thisqty = MyParseFloat(mlresults[i].getValue(c));
								if(thisqty>0){
									item = 1121; // TNI
									qty = thisqty;
									if(qty>0)
										prodstr += ' | TNI-'+qty;
								}
							}
							else if(c.getLabel()=='HD'){
								thisqty = MyParseFloat(mlresults[i].getValue(c));
								if(thisqty>0){
									item = 1020; // HD
									qty = thisqty;
									if(qty>0)
										prodstr += ' | HD-'+qty;
								}
							}
							
							if(isNotEmpty(item)){
								for(var ii in iteminfo){
									var thisitem = iteminfo[ii].item;
									if(thisitem==item){
										item = nlapiEscapeXML(iteminfo[ii].itemid);
										desc = nlapiEscapeXML(iteminfo[ii].desc);
										break;
									}
								}
								
								labellines.push({
									'custid' : custid,
									'item' : item,
									'qty' : qty,
									'desc' : desc
								});
							}
						}
					});
					prodstrings[custid] = nlapiEscapeXML(prodstr);
					prevcustid = custid;
	            }
	            else{
	            	var mlfils = [];
	        		mlfils.push(new nlobjSearchFilter('custrecord_ci_item',null,'anyof',items));
	        		if(isNotEmpty(date)){
	        			mlfils.push(new nlobjSearchFilter('custrecord_ci_startdate',null,'onorbefore',date));
	        			mlfils.push(new nlobjSearchFilter('custrecord_ci_enddate',null,'onorafter',date));
	        		}
	        		mlfils.push(new nlobjSearchFilter('custrecord_ci_handdelivery',null,'is',handdelivery));
					mlfils.push(new nlobjSearchFilter('internalidnumber', 'custrecord_ci_bill_to_customer', 'greaterthan', prevcustid));
					var mlresults = nlapiSearchRecord(null,'customsearch__mailing_labels',mlfils);
					if(isNotEmpty(mlresults))
						i = -1;
					else
						break;
				}
			}
		}
		
		if(noresults==true)
			throw nlapiCreateError('ERROR','There are no lables to print',true);
			
		// START BUILDING XML
		
		// BUILD UP CSS
	    var css = '<style type="text/css">';
	    css += 'table {table-layout:fixed;width:100%;line-height:100%;}';
	    css += 'table.header {padding-top:-10px;}';
	    css += 'td.header {font-size:12pt;padding:.2cm 0 0 .2cm;border:0px solid black;}';
	    css += 'td.header-right {border:0px solid black;}';
	    css += 'td.header-right-split-left {border:0px solid black;}';
	    css += 'td.header-right-split-right {border:0px solid black;}';
	    css += 'td.delinstr {padding-top:.5cm;border:0px solid black;}';
	    css += 'p {text-align:left;}';
	    css += 'p.right {text-align:right;}';
	    css += 'td.middle {font-size:10pt;border:0px solid black;}';
	    css += 'table.footer {padding-top:.5cm;}';
	    css += 'table.middle {padding-top:.6cm;}';
	    css += 'td.footer {font-size:10pt;}';
	    css += 'th {font-weight:bold;text-decoration:none;border-bottom: 1px;padding:0 0 3px 0;}';
	    css += 'td {padding:10px 0 0 0;}';
	    css += '.address {margin:0 0 0 375px;font-size:12pt;}';
	    css += '.tdheader {border:0px solid black;}';
	    css += '.sectionhdr {font-size:18px;font-weight:bold;}';
	    css += '</style>';
	    
		// BUILD UP HEADER TABLE
	    var header = '<macro id="myheader">';
	    header += '<table style="margin:60px 50px 0 0;">';
	    
	    header += '<tr>';
	    header += '<td class="tdheader" align="left">';
	    header += '<img style="height:29;width:160;" src="' + ccerpGetLogoURL() + '" />';
	    header += '</td>';
	    //header += '<td class="tdheader" align="right" valign="bottom">Page <pagenumber/> of <totalpages/></td>';
	    header += '<td class="tdheader sectionhdr" align="right">';
	    header += 'PACKING SLIP';
	    header += '</td>';
	    header += '</tr>';
	    
	    header += '<tr>';
	    header += '<td class="tdheader" align="left">';
	    header += ccerpGetCompanyAddress();
	    header += '</td>';
	    header += '<td class="tdheader" align="right">';
	    header += nlapiDateToString(new Date());
	    header += '</td>';
	    header += '</tr>';
	    
	    header += '</table>';
	    header += '</macro>';
	    
	    
	    // BUILD UP FOOTER TABLE
	    var footer = '';
	    
	    for(var c in custids){
	    	footer += '<macro id="'+custids[c].custid+'">';
	    	if(isNotEmpty(custids[c].zip))
	    		footer += '<p class="address"><barcode codetype="postnet" showtext="false" value="'+custids[c].zip+'"/></p>';
	    	footer += '<p class="address">'+custids[c].address+'</p>';
	    	footer += '<p width="225" border="0" align="left"><b>Customer:</b> '+nlapiEscapeXML(custids[c].customerTxt)+'</p>';
	    	footer += '<p class="address" style="font-size:10pt;">'+prodstrings[custids[c].custid]+'</p>';
	    	footer += '</macro>';
	    }
	    
	    // ADD MACROLIST
	    var macrolist = '<macrolist>';
	    macrolist += header;
	    macrolist += footer;
	    macrolist += '</macrolist>';
	    
	    // BUILD UP XML
	    var xml = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
	    xml += '<pdf>';
	    xml += '<head>';
	    xml += css;
	    xml += macrolist;
	    xml += '</head>';
	    xml += '<body header="myheader" header-height="6cm" footer="'+custids[0].custid+'" footer-height="8cm" margin="-.5in -.5in -.5in 0in" font-size="10pt" width="8.5in" height="11in" font-family="Helvetica" background-color="white" color="black">';
	    
		
		// For each custid create label object and Fetch XML
		for(var c in custids){
			// get header data
			var custid = custids[c].custid;
			var address = custids[c].address;
			var label = {};
			label.custid = custid;
			label.address = address;
			
			// get items data for this custid
			var items = [];
			for(var l in labellines){
				if(labellines[l].custid == custid){
					items.push({
						'item' : labellines[l].item,
						'qty' : labellines[l].qty,
						'desc' : labellines[l].desc
					});
				}
			}
			
			label.items = items;
			//nlapiLogExecution('debug', 'ccerp_PrintMailingLabels', JSON.stringify(label));
			
			if(c>0){
				/*var footer = '<macro id="footer">';
				footer += '<p class="address">'+address+'</p>';
			    footer += '</macro>';*/
			    xml += '<pbr footer="'+custid+'" footer-height="8cm" />';
			}
			xml += ccerp_PrintMailingLabels_GetXML(label);
		}
		
		// Close Body and PDF
		xml += '</body></pdf>';
		
		var usageRemaining = parseFloat(context.getRemainingUsage());
		nlapiLogExecution('debug', 'usageRemaining '+usageRemaining);
		
		// For testing only - create XML file for review
			/*var newFile = nlapiCreateFile('xml.xml', 'XMLDOC', xml);
			newFile.setFolder(-15); // SuiteScripts Folder
			newFile.setEncoding('UTF-8');
			nlapiSubmitFile(newFile);*/
		
		var file = nlapiXMLToPDF(xml);
		var ext = 'pdf';
	    var fileName = 'mailing' + '_' + TimeStampSuffix() + '.' + ext;
		file.setName(fileName);
		response.setContentType('PDF', fileName, 'inline');
    	response.write(file.getValue());
	}
}

function ccerp_PrintMailingLabels_GetXML(label){
	// add XML for items table
	var labelXML = '';
	labelXML += '<table style="margin:0 50px 20px 0;border:0px;">';
	labelXML += '<tr>';
	labelXML += '<th width="15%" align="left">Qty</th>';
	labelXML += '<th width="20%" align="left">Item</th>';
	labelXML += '<th width="65%" align="left">Description</th>';
	labelXML += '</tr>';
	
	var items = label.items;
	//nlapiLogExecution('debug', 'ccerp_PrintMailingLabels_GetXML', JSON.stringify(items));
	for(var i in items){
		var item = items[i].item;
		var qty = items[i].qty;
		var desc = items[i].desc;
		//nlapiLogExecution('debug', 'ccerp_PrintMailingLabels_GetXML', 'item '+item+' qty '+qty+' desc '+desc);
		labelXML += '<tr>';
		labelXML += '<td><p align="left">' + qty + '</p></td>';
		labelXML += '<td><p align="left">' + item + '</p></td>';
		labelXML += '<td><p align="left">' + desc + '</p></td>';
		labelXML += '</tr>';
	}
	labelXML += '</table>';
	return labelXML;
}

function ccerp_PrintMailingLabels_PageInit(type){
	var date = nlapiGetFieldValue('date');
	if(isNotEmpty(date)){
		var url = nlapiResolveURL('SUITELET', 'customscript_ccerp_printmailinglabels','customdeploy1');
		window.open(url,'_self');
	}
}

function ccerpGetItemInfoJSON(itemsArr){
	if(isEmpty(itemsArr)) return;
	var iteminfo = [];
	var itemfils = [];
	itemfils.push(new nlobjSearchFilter('internalid', null, 'anyof', itemsArr));
	var itemcols = [];
	itemcols.push(new nlobjSearchColumn('itemid'));
	itemcols.push(new nlobjSearchColumn('salesdescription'));
	var itemresults = nlapiSearchRecord('item', null, itemfils, itemcols);
	if(isNotEmpty(itemresults)){
		for(var ir in itemresults){
			iteminfo.push({
				'item':itemresults[ir].getId(),
				'itemid':itemresults[ir].getValue('itemid'),
				'desc':itemresults[ir].getValue('salesdescription')
			});
		}
	}
	return iteminfo;
}

function ccerp_PrintMailingLabels_SaveRecord(){
	var items = nlapiGetFieldValue('items');
	if(isEmpty(items)){
		alert('Choose Items');
		return false;
	}
	return true;
}
/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Sep 2015     huichanyi
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

/*
 *  [type, New Business, Renewal Businss]
 *  [Sales Rep, New Business Value, Renewal Value]
 * 
 */

function initPage() {
	var submitRow = document.getElementById('tbl_submitter');
	submitRow.style.display = "none";
	
	var title = document.getElementsByClassName('uir-page-title');
	title[0].style.display = "none";
	
	var goBtn = document.createElement('BUTTON');
	var goBtnTxt = document.createTextNode('GO');
	goBtn.appendChild(goBtnTxt);
	
	goBtn.style.padding = '4px 18px';
	goBtn.style.backgroundColor = '#88E188';
	goBtn.style.border = '1px solid #eee';
	goBtn.style.color = '#fff';
	goBtn.style.fontWeight = '800';
	var elem = document.getElementById('custpage_date_from_fs_lbl_uir_label');
	var td = elem.parentNode.parentNode;
	if(td){
		td.appendChild(goBtn);
	}
	
	var elelist = document.getElementsByTagName("input");
	for(var i = 0; i < elelist.length; i++){
	    elelist[i].addEventListener("focus", function(){
	        this.blur();
	    });
	}

}



function googleChartSample(request, response){
	var form = nlapiCreateForm('', true);
	
	form.addSubmitButton('Generate Chart');
	form.setScript('customscript_ta_google_client');
	
	var date = new Date();
	var firstDay = nlapiDateToString(new Date(date.getFullYear(), date.getMonth(), 1), 'MM/DD/YYYY');
	var lastDay = nlapiDateToString(new Date(date.getFullYear(), date.getMonth()+1, 0), 'MM/DD/YYYY');
	
	var thismonday = date.getDate() - date.getDay() + 1;
	var thissunday = thismonday + 6;
	
	var thisSunday = new Date(date.setDate(thissunday));
	var twSunday = nlapiDateToString(thisSunday, 'MM/DD/YYYY');
	
	var beforeTwoWeek = new Date(new Date().getTime() - 60 * 60 * 24 * 14 * 1000)
	  , day = beforeTwoWeek.getDay()
	  , diffToMonday = beforeTwoWeek.getDate() - day + (day === 0 ? -6 : 1)
	  , lastMonday = new Date(beforeTwoWeek.setDate(diffToMonday));
	
	var wblMonday = nlapiDateToString(lastMonday, 'MM/DD/YYYY');
	//***********************************//
	// Activity Chart Display Begins     //
	//				GET					 //
	//***********************************//
	
	var actvitySrchFilter1 = [ new nlobjSearchFilter('date', null, 'within','thisWeek') ];
	var actvitySrchFilter2 = [ new nlobjSearchFilter('date', null, 'within','lastWeek') ];
	var actvitySrchFilter3 = [ new nlobjSearchFilter('date', null, 'within', 'weekBeforeLast') ];
	var activityData = [];
	activityData.push(['Sales Rep', 'This Week','Last Week', 'Week Before Last']);
	
	var activitySrchResult_TW = nlapiSearchRecord(null, 'customsearch__sales_rep_activity_search', actvitySrchFilter1);
	var activitySrchResult_LW = nlapiSearchRecord(null, 'customsearch__sales_rep_activity_search', actvitySrchFilter2);
	var activitySrchResult_WBL = nlapiSearchRecord(null, 'customsearch__sales_rep_activity_search', actvitySrchFilter3);
	
	var cols; 
	
	if(isNotEmpty(activitySrchResult_TW)){
		cols = activitySrchResult_TW[0].getAllColumns(); 
	}else if(isNotEmpty(activitySrchResult_LW)){
		cols = activitySrchResult_LW[0].getAllColumns();
	}else{
		cols = activitySrchResult_WBL[0].getAllColumns();
	}
	
	// Append Results to Array
	
	function appendActData(srchResult, arrayIndex) {
		if(isNotEmpty(srchResult)){
			
			for(var i = 0; i < srchResult.length; i++){
				var salesrep_id = srchResult[i].getText(cols[0].getName(), cols[0].getJoin(), cols[0].getSummary());
				var salesrep = salesrep_id.substr(salesrep_id.indexOf(" ")+1, salesrep_id.length);
				if( !isInArray(activityData, salesrep)){
					activityData.push([salesrep]);
				}
				
				// find sales rep's array and append to activityData[i][1]
				if(indexOfSalesRep(activityData, salesrep)){
					var index = indexOfSalesRep(activityData, salesrep);
					activityData[index][arrayIndex] = parseInt(srchResult[i].getValue(cols[1].getName(), cols[1].getJoin(), cols[1].getSummary()));
				}
			}	
		}
	}
	
	appendActData(activitySrchResult_TW, 1);
	appendActData(activitySrchResult_LW, 2);
	appendActData(activitySrchResult_WBL, 3);
	
	for(var i = 0; i < activityData.length; i++){
		for(var y = 0; y < 4; y++){
			if(activityData[i][y] == undefined){
				activityData[i][y] = 0;
			}
		}
	}
	
	var googleData_activity = JSON.stringify(activityData);
	
	nlapiLogExecution('DEBUG', 'Activity Data', googleData_activity);
	var hidden_field = form.addField('custpage_hidden_input', 'text', 'Hide me').setDisplayType('hidden');
	var date_from =  form.addField('custpage_date_from', 'date', 'Date From', null);
	date_from.setDisplaySize(20).setLayoutType('startrow', 'startcol');
	date_from.setDefaultValue(firstDay)
	var date_to = form.addField('custpage_date_to', 'date', 'Date To', null);
	date_to.setDisplaySize(20).setLayoutType('midrow', 'startrow');
	date_to.setDefaultValue(lastDay);
	//form.addFieldGroup('custpage_result', 'Google Chart Result');
	var resultDiv = form.addField('chart_result', 'inlinehtml', '', null);
	var activityDiv = form.addField('activity_result', 'inlinehtml', '', null);
	
	var srchFilter = [ new nlobjSearchFilter('trandate', null, 'within', firstDay, lastDay) ];
	var googleData = [];
//	googleData.push([{label: 'Sales Rep', id: 'salesrep', type: 'string'}, 
//	                 {label: 'New Business', id : 'newbusiness', type: 'number'}, 
//	                 {label: 'Renewal Business', id: 'renewal', type: 'number'}]);
//	
	googleData.push(['Sales Rep', 'Renewals', 'New Existing', 'New New', {role: 'annotation'}])
	
	
	var srchResult = nlapiSearchRecord(null, 'customsearchslb2_6_2', srchFilter);
	
	//***********************************//
	// Sales Leader board Display Begins //
	//				  GET			     //
	//***********************************//
	
	if(isNotEmpty(srchResult)){
		for(var i = 0; i < srchResult.length; i++){
			var cols = srchResult[i].getAllColumns();
			var salesRep = srchResult[i].getText(cols[0].getName(), cols[0].getJoin(), cols[0].getSummary());
			//var newBusiness = srchResult[i].getValue("custbody_ta_trans_new_business", null, "SUM");
			var renewals = srchResult[i].getValue(cols[1].getName(), cols[1].getJoin(), cols[1].getSummary());
			var newFromNew = MyParseFloat(srchResult[i].getValue(cols[3].getName(), cols[3].getJoin(), cols[3].getSummary()));
			var totalNew = MyParseFloat(srchResult[i].getValue(cols[4].getName(), cols[4].getJoin(), cols[4].getSummary()));
			var newFromExisting = (totalNew - newFromNew);
			
			googleData.push([salesRep.substr(salesRep.indexOf(" ") +1, salesRep.length), MyParseFloat(renewals), newFromExisting, newFromNew, '']); // += '[\''+salesRep+'\','+newBusiness+', '+renewalBusiness+', \'\' ],';
		}
		
		// getting this week's last day
//		var curr = new Date;
//		var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay()+6));
		
		// getting two week's ago Monday
		
		
		
		googleData = JSON.stringify(googleData);
		//googleData = googleData.substring(0, (googleData.length - 1));
		nlapiLogExecution('DEBUG', 'googleData Get Part ', googleData);
		var style = '<style> position: relative;</style>';
		var html = '<div id="chart_div"style="position: relative; display: inline-block; margin: 0 auto; width: 45%;"></div><div id="chart_div2" style="position: relative; display: inline-block;  margin: 0 auto; width: 45%;"></div>';
		var googleSct = '<script type="text/javascript" src="https://www.google.com/jsapi"></script>'+
		'<script type="text/javascript">'+
		'google.load("visualization", "1.1", {packages:["corechart", "bar"]});'+
		'google.setOnLoadCallback(drawChart);'+
		'function drawChart() {'+
		'var data = google.visualization.arrayToDataTable('+googleData+');'+
		'var data2 = google.visualization.arrayToDataTable('+googleData_activity+');'+
		
		'var options = { width: 400, height: 320, is3D: true, isStacked: true,' +
		'animation:{ "startup": true, duration: 800, easing: \'out\' },'+
		'chartArea : {width: \'75%\', height: \'75%\'},'+
		'legend: { position: \'top\', maxLines: 7 }, colors: [\'#DAEFB3\',\'#17BEBB\',\'#0E7C7B\'] };'+
		
		'var options2 = { chart:{title: "Sales Activity"}, hAxis: { minValue: 0, ticks:[10,20] }, vAxis: {title: ""},'+ 
		'width: 400, height: 320, chartArea : {width: \'75%\', height: \'75%\'}, legend :{position: "top"},'+
		'animation:{ startup: true, duration: 800, easing: "out"},' +
		'groupWidth: "85%"};' +
		
        'var formatter = new google.visualization.NumberFormat({ prefix: \'$\', fractionDigits: 2 });'+
        'formatter.format(data, 1); formatter.format(data, 2); formatter.format(data, 3); formatter.format(data, 4);' +
		'var chart = new google.visualization.ColumnChart(document.getElementById("chart_div"));'+
		'var chart2 = new google.visualization.ColumnChart(document.getElementById("chart_div2"));'+
        'chart.draw(data, options);'+
        'chart2.draw(data2, google.charts.Bar.convertOptions(options2));'+
        'google.visualization.events.addListener(chart, \'select\', selectHandler );'+
        'google.visualization.events.addListener(chart2, "select", chart2Event );'+
        'function selectHandler() {' +
		'var selectedItem = chart.getSelection()[0];' +
		'var value = data.getValue(selectedItem.row, 0); ' +

		'if(value == \'Kevin Williams\') { window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=1628167&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Jeffrey Cottrell\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=17871&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Kathi Ellis\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=51703&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Farrah Hudson\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=46420&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Peter Billingsley\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=17818&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Elias Monterroso\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=17625&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Anthony Zoppo\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=19383&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Eli Lasser\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=46408&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'else if(value == \'Carrie Fuhrer\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=106729&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+firstDay+'&Transaction_TRANDATEto='+lastDay+'\');}'+
		'}'+
		'function chart2Event(){' +
		'var selectedItem = chart2.getSelection()[0];' +
		'if(selectedItem){'+
		'var value = data2.getValue(selectedItem.row, 0);' +
		'if(value == "Jeffrey Cottrell"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=17871")}' +
		'else if(value == "Kathi Ellis"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=51703")}' +
		'else if(value == "Kevin Williams"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=1628167")}' +
		'else if(value == "Farrah Hudson"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=46420")}' +
		'else if(value == "Peter Billingsley"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=17818")}' +
		'else if(value == "Elias Monterroso"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=17625")}' +
		'else if(value == "Anthony Zoppo"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=19383")}' +
		'else if(value == "Eli Lasser"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=46408")}' +
		'else if(value == "Carrie Fuhrer"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=106729")}' +
		'else { return false; }' +
		'}' +
		//https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom=10/1/2015&Activity_DATEto=10/10/2015&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=17871
		'}' +
		'}'+
		'</script>';
		resultDiv.setDefaultValue(style+googleSct+html);
		
		/****************************
		 *   Activity Google Chart 
		 * 
		 * **************************/
//		var html2 = '<div id="act_chart_div" style = "width: 400px; heigh: 300px;"></div>';
//		var actScript = '<script type="text/javascript" src="https://www.google.com/jsapi"></script>'+
//		'<script type="text/javascript">'+
//		'google.load(\'visualization\', \'1\', {packages: [\'corechart\', \'bar\']});'+
//		'google.setOnLoadCallback(drawActivity);' +
//		
//		'function drawActivity(){' +
//		'var data2 = google.visualization.arrayToDataTable('+googleData+');'+
//		'var chart2 = new google.visualization.ColumnChart(document.getElementById("chart_div"));'+
//		'chart.draw(data2);'+
//		'}'+
//		'</script>'
//		activityDiv.setDefaultValue(html2+actScript);
		
	}else{
		resultDiv.setDefaultValue('No result found');
	}
	

	
	
	
	if(request.getMethod() == 'POST'){
		
		
		//***********************************//
		// Activity Chart Display Begins     //
		//				POST				 //
		//***********************************//
		
		var actvitySrchFilter1 = [ new nlobjSearchFilter('date', null, 'within','thisWeek') ];
		var actvitySrchFilter2 = [ new nlobjSearchFilter('date', null, 'within','lastWeek') ];
		var actvitySrchFilter3 = [ new nlobjSearchFilter('date', null, 'within', 'weekBeforeLast') ];
		var activityData = [];
		activityData.push(['Sales Rep', 'This Week','Last Week', 'Week Before Last']);
		
		var activitySrchResult_TW = nlapiSearchRecord(null, 'customsearch__sales_rep_activity_search', actvitySrchFilter1);
		var activitySrchResult_LW = nlapiSearchRecord(null, 'customsearch__sales_rep_activity_search', actvitySrchFilter2);
		var activitySrchResult_WBL = nlapiSearchRecord(null, 'customsearch__sales_rep_activity_search', actvitySrchFilter3);
		
		var cols;
		
		if(isNotEmpty(activitySrchResult_TW)){
			cols = activitySrchResult_TW[0].getAllColumns(); 
		}else if(isNotEmpty(activitySrchResult_LW)){
			cols = activitySrchResult_LW[0].getAllColumns();
		}else{
			cols = activitySrchResult_WBL[0].getAllColumns();
		}
		// Append Results to Array
		
		function appendActData(srchResult, arrayIndex) {
			if(isNotEmpty(srchResult)){
				
				for(var i = 0; i < srchResult.length; i++){
					var salesrep_id = srchResult[i].getText(cols[0].getName(), cols[0].getJoin(), cols[0].getSummary());
					var salesrep = salesrep_id.substr(salesrep_id.indexOf(" ")+1, salesrep_id.length);
					if( !isInArray(activityData, salesrep)){
						activityData.push([salesrep]);
					}
					
					// find sales rep's array and append to activityData[i][1]
					if(indexOfSalesRep(activityData, salesrep)){
						var index = indexOfSalesRep(activityData, salesrep);
						activityData[index][arrayIndex] = parseInt(srchResult[i].getValue(cols[1].getName(), cols[1].getJoin(), cols[1].getSummary()));
					}
				}	
			}
		}
		
		appendActData(activitySrchResult_TW, 1);
		appendActData(activitySrchResult_LW, 2);
		appendActData(activitySrchResult_WBL, 3);
		
		for(var i = 0; i < activityData.length; i++){
			for(var y = 0; y < 4; y++){
				if(activityData[i][y] == undefined){
					activityData[i][y] = 0;
				}
			}
		}
		
		var googleData_activity = JSON.stringify(activityData);
		
		nlapiLogExecution('DEBUG', 'Activity Data', googleData_activity);
		
		
		
		var fromDate = request.getParameter('custpage_date_from');
		var toDate = request.getParameter('custpage_date_to');
		
		date_from.setDefaultValue(fromDate);
		date_to.setDefaultValue(toDate);
		
//        [{label: 'City', id: 'city', type: 'string'},
//         {label: '2010', id: '2010', type: 'number'},
//         {label: '2000', id: '2000', type: 'number'}
//        ],
		
		var srchFilter = [ new nlobjSearchFilter('trandate', null, 'within', fromDate, toDate) ];
		var googleData = [];
//		googleData.push([{label: 'Sales Rep', id: 'salesrep', type: 'string'}, 
//		                 {label: 'New Business', id : 'newbusiness', type: 'number'}, 
//		                 {label: 'Renewal Business', id: 'renewal', type: 'number'}]);
//		
		googleData.push(['Sales Rep', 'Renewals', 'New Existing', 'New New', {role: 'annotation'}])
		
		
		var srchResult = nlapiSearchRecord(null, 'customsearchslb2_6_2', srchFilter);
		
		
		//***********************************//
		// Sales Leader board Display Begins //
		//				  POST			     //
		//***********************************//
		
		
		if(isNotEmpty(srchResult)){
			for(var i = 0; i < srchResult.length; i++){
				var cols = srchResult[i].getAllColumns();
				var salesRep = srchResult[i].getText(cols[0].getName(), cols[0].getJoin(), cols[0].getSummary());
				//var newBusiness = srchResult[i].getValue("custbody_ta_trans_new_business", null, "SUM");
				var renewals = srchResult[i].getValue(cols[1].getName(), cols[1].getJoin(), cols[1].getSummary());
				var newFromNew = MyParseFloat(srchResult[i].getValue(cols[3].getName(), cols[3].getJoin(), cols[3].getSummary()));
				var totalNew = MyParseFloat(srchResult[i].getValue(cols[4].getName(), cols[4].getJoin(), cols[4].getSummary()));
				var newFromExisting = (totalNew - newFromNew);
				
				googleData.push([salesRep.substr(salesRep.indexOf(" ") +1, salesRep.length), MyParseFloat(renewals), newFromExisting, newFromNew, '']); // += '[\''+salesRep+'\','+newBusiness+', '+renewalBusiness+', \'\' ],';
			}
			
			// getting this week's last day
//			var curr = new Date;
//			var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay()+6));
			
			// getting two week's ago Monday
			
			
			
			googleData = JSON.stringify(googleData);
			//googleData = googleData.substring(0, (googleData.length - 1));
			nlapiLogExecution('DEBUG', 'googleData Get Part ', googleData);
			var style = '<style> position: relative;</style>';
			var html = '<div id="chart_div"style="position: relative; display: inline-block; margin: 0 auto; width: 45%;"></div><div id="chart_div2" style="position: relative; display: inline-block;  margin: 0 auto; width: 45%;"></div>';
			var googleSct = '<script type="text/javascript" src="https://www.google.com/jsapi"></script>'+
			'<script type="text/javascript">'+
			'google.load("visualization", "1", {packages:["corechart", "bar"]});'+
			'google.setOnLoadCallback(drawChart);'+
			'function drawChart() {'+
			'var data = google.visualization.arrayToDataTable('+googleData+');'+
			'var data2 = google.visualization.arrayToDataTable('+googleData_activity+');'+
			
			'var options = { width: 400, height: 320, is3D: true, isStacked: true,' +
			'animation:{ "startup": true, duration: 800, easing: \'out\' },'+
			'chartArea : {width: \'75%\', height: \'75%\'},'+
			'legend: { position: \'top\', maxLines: 7 }, colors: [\'#DAEFB3\',\'#17BEBB\',\'#0E7C7B\'] };'+
			
			'var options2 = { chart:{title: "Sales Activity"}, hAxis: { minValue: 0, ticks:[10,20] }, vAxis: {title: ""},'+ 
			'width: 500, height: 320, chartArea : {width: \'100%\', height: \'100%\'}, legend :{position: "top"},'+
			'animation:{ startup: true, duration: 800, easing: "out"},' +
			'groupWidth: "85%", bars: "horizontal"};' +
			
	        'var formatter = new google.visualization.NumberFormat({ prefix: \'$\', fractionDigits: 2 });'+
	        'formatter.format(data, 1); formatter.format(data, 2); formatter.format(data, 3); formatter.format(data, 4);' +
			'var chart = new google.visualization.ColumnChart(document.getElementById("chart_div"));'+
			'var chart2 = new google.charts.Bar(document.getElementById("chart_div2"));'+
	        'chart.draw(data, options);'+
	        'chart2.draw(data2, google.charts.Bar.convertOptions(options2));'+
	        'google.visualization.events.addListener(chart, \'select\', selectHandler );'+
	        'google.visualization.events.addListener(chart2, "select", chart2Event );'+
	        'function selectHandler() {' +
			'var selectedItem = chart.getSelection()[0];' +
			'var value = data.getValue(selectedItem.row, 0); ' +
			'if(value == \'Jason Rizzo\') { window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=51704&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Jeffrey Cottrell\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=17871&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Kathi Ellis\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=51703&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Farrah Hudson\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=46420&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Peter Billingsley\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=17818&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Elias Monterroso\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=17625&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Anthony Zoppo\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=19383&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Eli Lasser\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=46408&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'else if(value == \'Carrie Fuhrer\'){ window.open(\'https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_SALESREPtype=ANYOF&Transaction_SALESREP=106729&detail=Transaction_SALESREP&searchid=710&Transaction_TRANDATEmodi=WITHIN&Transaction_TRANDATE=CUSTOM&Transaction_TRANDATEfrom='+fromDate+'&Transaction_TRANDATEto='+toDate+'\');}'+
			'}'+
			'function chart2Event(){' +
			'var selectedItem = chart2.getSelection()[0];' +
			'if(selectedItem){'+
			'var value = data2.getValue(selectedItem.row, 0);' +
			'if(value == "Jeffrey Cottrell"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=17871")}' +
			'else if(value == "Kathi Ellis"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=51703")}' +
			'else if(value == "Jason Rizzo"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=51704")}' +
			'else if(value == "Farrah Hudson"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=46420")}' +
			'else if(value == "Peter Billingsley"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=17818")}' +
			'else if(value == "Elias Monterroso"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=17625")}' +
			'else if(value == "Anthony Zoppo"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=19383")}' +
			'else if(value == "Eli Lasser"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=46408")}' +
			'else if(value == "Carrie Fuhrer"){ window.open("https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_DATErange=CUSTOM&Activity_DATEfrom='+ wblMonday +'&Activity_DATEto='+twSunday+'&style=NORMAL&Activity_DATEmodi=WITHIN&Activity_DATE=CUSTOM&report=&grid=&searchid=793&detail=Activity_OWNER&Activity_OWNER=106729")}' +
			'else { return false; }' +
			'}' +
			//https://system.na1.netsuite.com/app/common/search/searchresults.nl?searchtype=Activity&Activity_OWNERtype=ANYOF&Activity_OWNER=17871&detail=Activity_OWNER&searchid=793&Activity_DATEmodi=WITHIN&Activity_DATE=TW
			
			'}' +
			'}'+
			'</script>';
			resultDiv.setDefaultValue(style+googleSct+html);
			
			/****************************
			 *   Activity Google Chart 
			 * 
			 * **************************/
//			var html2 = '<div id="act_chart_div" style = "width: 400px; heigh: 300px;"></div>';
//			var actScript = '<script type="text/javascript" src="https://www.google.com/jsapi"></script>'+
//			'<script type="text/javascript">'+
//			'google.load(\'visualization\', \'1\', {packages: [\'corechart\', \'bar\']});'+
//			'google.setOnLoadCallback(drawActivity);' +
//			
//			'function drawActivity(){' +
//			'var data2 = google.visualization.arrayToDataTable('+googleData+');'+
//			'var chart2 = new google.visualization.ColumnChart(document.getElementById("chart_div"));'+
//			'chart.draw(data2);'+
//			'}'+
//			'</script>'
//			activityDiv.setDefaultValue(html2+actScript);
			
		}else{
			resultDiv.setDefaultValue('No result found');
		}
		
	}
	
	response.writePage(form);
}


function isInArray(array, item) {
	for(var i = 0; i < array.length; i++){
		if(array[i][0] == item){
			return true;
		}
	}
	return false;
}

function indexOfSalesRep(array, salesrep) {
	for(var i = 0; i < array.length; i++){
		if(array[i][0] == salesrep){
			return i;
		}
	}
	return false;
}

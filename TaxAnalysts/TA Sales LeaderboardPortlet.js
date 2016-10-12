/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Sep 2015     huichanyi
 *
 */

/**
 * @param {nlobjPortlet} portletObj Current portlet object
 * @param {Number} column Column position index: 1 = left, 2 = middle, 3 = right
 * @returns {Void}
 */
function ta_Leaderboard_Portlet(portletObj, column) {
	var content;	
	content = '<iframe scrolling="no" align="left" width="1000px" height="430px" src="https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=216&deploy=1" style="position: relative; margin-left: 3%; border:0px; padding:0.5%; width: 95%; min-height: 400px; height:auto; display:block;"></iframe>';
	
	//show the content of the portlet on the screen
	portlet.setTitle('Sales Leader Board');
	portlet.setHtml(content);
}

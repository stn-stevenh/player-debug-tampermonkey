javascript:(async function() {
	const searchParams = new URLSearchParams(location.search);
	const isDev        = searchParams.has('stnDev');
	const branch       = isDev ? 'development' : 'master';

	const findIssues = function ( node, issues = [] )
	{
		/* the root element (HTML). */
		if ( ! node || node.nodeName === 'HTML' )
		{
			return issues;
		}

		/* handle shadow root elements. */
		if ( node.nodeName === '#document-fragment' )
		{
			return findIssues( node.host, issues );
		}

		const computedStyle = getComputedStyle( node );

		/* Player is hidden */
		if ( computedStyle.display === 'none' )
		{
			issues.push({ node: node, reason: `display: ${ computedStyle.display }` });
		}

		return findIssues( node.parentNode, issues );
	};

	const sharedFunctions = await import(`https://cdn.jsdelivr.net/gh/stn-stevenh/player-debug-tampermonkey@${branch}/scripts/sharedFunctions.js`);
	const msg = sharedFunctions.runner('Check Common Player Issues', findIssues);

	if (msg)
	{
		if (msg.length)
		{
			alert("Players have issues 👎:\n\n" + msg.join('\n'));
			console.warn("Players have issues 👎:\n\n" + msg.join('\n'));
		}
		else
		{
			alert("Could not find any players with issues. 👍");
			console.warn("Could not find any players with issues. 👍");
		}
	}
})();

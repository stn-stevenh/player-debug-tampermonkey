javascript:(async function() {
	const getClosestStackingContext = function ( node, issues = [] )
	{
		/* the root element (HTML). */
		if ( ! node || node.nodeName === 'HTML' )
		{
			return issues;
		}

		/* handle shadow root elements. */
		if ( node.nodeName === '#document-fragment' )
		{
			return getClosestStackingContext( node.host, issues );
		}

		const computedStyle = getComputedStyle( node );

		/* position: fixed or sticky. */
		if ( computedStyle.position === 'fixed' || computedStyle.position === 'sticky' )
		{
			issues.push({ node: node, reason: `position: ${ computedStyle.position }` });
		}

		/* positioned (absolutely or relatively) with a z-index value other than "auto". */
		if ( computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static' )
		{
			issues.push({ node: node, reason: `position: ${ computedStyle.position }; z-index: ${ computedStyle.zIndex }` });
		}

		/* elements with an opacity value less than 1. */
		if ( computedStyle.opacity !== '1' )
		{
			issues.push({ node: node, reason: `opacity: ${ computedStyle.opacity }` });
		}

		/* elements with a transform value other than "none". */
		if ( computedStyle.transform !== 'none' )
		{
			issues.push({ node: node, reason: `transform: ${ computedStyle.transform }` });
		}

		/* elements with a mix-blend-mode value other than "normal". */
		if ( computedStyle.mixBlendMode !== 'normal' )
		{
			issues.push({ node: node, reason: `mixBlendMode: ${ computedStyle.mixBlendMode }` });
		}

		/* elements with a filter value other than "none". */
		if ( computedStyle.filter !== 'none' )
		{
			issues.push({ node: node, reason: `filter: ${ computedStyle.filter }` });
		}

		/* elements with a backdrop-filter value other than "none". */
		if ( computedStyle.backdropFilter !== 'none' )
		{
			issues.push({ node: node, reason: `backdrop-filter: ${ computedStyle.backdropFilter }` });
		}

		/* elements with a perspective value other than "none". */
		if ( computedStyle.perspective !== 'none' )
		{
			issues.push({ node: node, reason: `perspective: ${ computedStyle.perspective }` });
		}

		/* elements with a clip-path value other than "none". */
		if ( computedStyle.clipPath !== 'none' )
		{
			issues.push({ node: node, reason: `clip-path: ${ computedStyle.clipPath } ` });
		}

		/* elements with a mask value other than "none". */
		const mask = computedStyle.mask || computedStyle.webkitMask;
		if ( mask !== 'none' && mask !== undefined )
		{
			issues.push({ node: node, reason: `mask:  ${ mask }` });
		}

		/* elements with a mask-image value other than "none". */
		const maskImage = computedStyle.maskImage || computedStyle.webkitMaskImage;
		if ( maskImage !== 'none' && maskImage !== undefined )
		{
			issues.push({ node: node, reason: `mask-image: ${ maskImage }` });
		}

		/* elements with a mask-border value other than "none". */
		const maskBorder = computedStyle.maskBorder || computedStyle.webkitMaskBorder;
		if ( maskBorder !== 'none' && maskBorder !== undefined )
		{
			issues.push({ node: node, reason: `mask-border: ${ maskBorder }` });
		}

		/* elements with isolation set to "isolate". */
		if ( computedStyle.isolation === 'isolate' )
		{
			issues.push({ node: node, reason: `isolation: ${ computedStyle.isolation }` });
		}

		/* transform or opacity in will-change even if you don't specify values for these attributes directly. */
		if ( computedStyle.willChange === 'transform' || computedStyle.willChange === 'opacity' )
		{
			issues.push({ node: node, reason: `willChange: ${ computedStyle.willChange }` });
		}

		/* elements with -webkit-overflow-scrolling set to "touch". */
		if ( computedStyle.webkitOverflowScrolling === 'touch' )
		{
			issues.push({ node: node, reason: '-webkit-overflow-scrolling: touch' });
		}

		/* an item with a z-index value other than "auto". */
		if ( computedStyle.zIndex !== 'auto' )
		{
			const parentStyle = getComputedStyle( node.parentNode );
			/* with a flex|inline-flex parent. */
			if ( parentStyle.display === 'flex' || parentStyle.display === 'inline-flex' )
			{
				issues.push({ node: node, reason: `flex-item; z-index: ${ computedStyle.zIndex }` });
			}
			/* with a grid parent. */
			else if ( parentStyle.grid !== 'none / none / none / row / auto / auto' )
			{
				issues.push({ node: node, reason: `child of grid container; z-index: ${ computedStyle.zIndex }` });
			}
		}

		/* contain with a value of layout, or paint, or a composite value that includes either of them */
		const contain = computedStyle.contain;
		if ( [ 'layout', 'paint', 'strict', 'content' ].indexOf( contain ) > -1 || contain.indexOf( 'paint' ) > -1 || contain.indexOf( 'layout' ) > -1)
		{
			issues.push({ node: node, reason: `contain: ${ contain }` });
		}

		return getClosestStackingContext( node.parentNode, issues );
	};

	// TODO: Import shared functions

	const sharedFunctions = await import('https://stevendev.sendtonews.com/bookmarklets/sharedFunctions.js');
	const msg = sharedFunctions.runner('Check Stacking Context', getClosestStackingContext);

	if (msg)
	{
		if (msg.length)
		{
			alert("Players are in stacking contexts 👎:\n\n" + msg.join('\n'));
			console.warn("Players are in stacking contexts 👎:\n\n" + msg.join('\n'));
		}
		else
		{
			alert("Could not find any players in a stacking context on page. 👍");
			console.warn("Could not find any players in a stacking context on page. 👍");
		}
	}
})();

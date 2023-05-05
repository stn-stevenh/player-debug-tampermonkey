function hexCode(value)
{
    return '%' + value.charCodeAt(0).toString(16);
}

function objectToUrlQuery(obj)
{
    return Object.entries(obj).map
    (
        ([key, value]) =>
        {
            while (typeof(value) === 'function')
            {
                value = value();
            }

            switch (typeof(value))
            {
                case 'boolean':
                case 'number':
                case 'string':
                case 'symbol':
                case 'bigint':
                    value = `${value}`;
                    break;
                case 'undefined':
                case 'object':
                    if (!value)
                    {
                        return null;
                    }

                    if(value instanceof Set)
                    {
                        value = [...value];
                    }

                    if (Array.isArray(value))
                    {
                        value = value.join(',');
                    }
                    else
                    {
                        value = objectToUrlQuery(value);
                    }
            }

            key   = key.replace(/[#=&%]/g, hexCode);
            value = value.replace(/[#&%+]/g, hexCode);

            return `${key}=${value}`;
        }
    )
    .filter(v => v)
    .join('&');
}

function log(data)
{
    // const url = `https://stevendev.sendtonews.com/debug-tool.php?${objectToUrlQuery(data)}`;
    // navigator.sendBeacon(url);
}


function generateSelector( element )
{
    let selector, tag = element.nodeName.toLowerCase();
    if ( element.id )
    {
        selector = '#' + element.getAttribute( 'id' );
    }
    else if ( element.getAttribute( 'class' ) )
    {
        selector = '.' + element.getAttribute( 'class' ).split( ' ' ).join( '.' );
    }
    return selector ? tag + selector : tag;
}

export function runner(button, findIssues)
{
    const players = Array.from(document.querySelectorAll('stn-player'));

    if (!players.length)
    {
        alert('No players found on the page.');
        return;
    }

    let msg = [];

    players.forEach
    (
        player =>
        {
            const playerKey = player.playerKey;
            const issues = findIssues(player);

            console.log({ playerKey, issues });

            if (issues.length)
            {
                msg.push(`- ${playerKey}:`);

                issues.forEach
                (
                    ({ node, reason }) =>
                    {
                        const humanNode = generateSelector(node);
                        msg.push(`    - ${humanNode} -> ${reason}`);
                        log
                        (
                            {
                                button,
                                playerKey,
                                node: humanNode,
                                reason,
                                url: window.location.href,
                            }
                        );
                    }
                );
            }
        }
    );
    return msg;
}

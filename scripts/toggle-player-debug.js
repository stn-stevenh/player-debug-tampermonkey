javascript:(
    function()
    {
        const url = new URL(location.href);
        const value = url.searchParams.get('stnDebug');
        if (value === '1')
        {
            url.searchParams.delete('stnDebug');
        }
        else
        {
            url.searchParams.set('stnDebug', '1');
        }
        location.href = url.href;
    }
)();

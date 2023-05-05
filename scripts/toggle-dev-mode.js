javascript:(
    function()
    {
        const url = new URL(location.href);
        const value = url.searchParams.get('stnDev');
        if (value === '1')
        {
            url.searchParams.delete('stnDev');
        }
        else
        {
            url.searchParams.set('stnDev', '1');
        }
        location.href = url.href;
    }
)();

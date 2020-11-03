export function fetchWithTimeout(timeout, url, options ) {
    return new Promise( (resolve, reject) => {

        
        const controller = new AbortController();
        const signal = controller.signal;

        // Set timeout timer
        let timer = setTimeout(
            () => { 
                controller.abort();
                reject( new Error('Request timed out') );
            },
            timeout
        );

        fetch( url, { ...options, signal:signal } ).then(
            response => resolve( response ),
            err => reject( err )
        ).finally( () => clearTimeout(timer) );
    })
}


const API_BASE_URL = 'http://localhost:3000/'

const consumeApi = async (signal) => {
    const response = await fetch(
        API_BASE_URL, {
            signal
        }
    );

    const reader = response.body
        .pipeThrough(
            new TextDecoderStream()
        )
        .pipeThrough(parseNDJSON())

    return reader;
}

function appendToHTML(element) {
    return new WritableStream({
        write({
            id, mig_year, education
        }) {
            element.innerHTML += `
                <article>
                    <div class="text">
                        <h3> ${id} </h3>
                        <p> MIG YEAR: ${mig_year} </p>
                        <p> EDUCATION: ${education} </p>
                    </div>
                </article>
            `
        }
    })
}

const parseNDJSON = () => {
    let ndJsonBuffer = '';

    return new TransformStream({
        transform(chunk, controller) {
            ndJsonBuffer += chunk;

            const brokedLine = ndJsonBuffer.split('\n');
            brokedLine.slice(0, -1).forEach(item => controller.enqueue(JSON.parse(item)));
            ndJsonBuffer = brokedLine[brokedLine.length - 1];
        },
        flush(controller) {
            if(!ndJsonBuffer) return;

            controller.enqueue(JSON.parse(ndJsonBuffer));
        }
    })
}

const [
    start,
    stop,
    cards
] = [
    'start', 'stop', 'cards',
].map(item => document.getElementById(item))

let abortController = new AbortController();

start.addEventListener('click', async () => {
    const readableStream = await consumeApi(abortController.signal);
    readableStream.pipeTo(appendToHTML(cards))
})

stop.addEventListener('click', () => {
    abortController.abort()
    abortController = new AbortController()
})


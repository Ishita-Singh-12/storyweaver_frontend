const assert = require('node:assert/strict');
const {readStoryStream} = require('./stream.js');
const wire = 'event: start\r\ndata: {}\r\n\r\nevent: delta\r\ndata: {"text":"Hello 🌙"}\r\n\r\nevent: done\r\ndata: {"truncated":false}\r\n\r\n';
const bytes = new TextEncoder().encode(wire);
function response(bytes, step) {
  return new Response(new ReadableStream({start(c) {
    for(let i=0;i<bytes.length;i+=step) c.enqueue(bytes.slice(i,i+step));
    c.close();
  }}));
}
(async () => {
  for(let step=1;step<=bytes.length;step++) {
    const events=[];
    await readStoryStream(response(bytes,step),(e,d)=>events.push([e,d]));
    assert.equal(events[1][1].text,'Hello 🌙');
    assert.equal(events[2][0],'done');
  }
  await assert.rejects(readStoryStream(response(new TextEncoder().encode('event: delta\ndata: {"text":"partial"}\n\n'),1),()=>{}),/interrupted/);
  await assert.rejects(readStoryStream(response(new TextEncoder().encode('event: error\ndata: {"error":"Provider failed"}\n\n'),1),()=>{}),/Provider failed/);
  await assert.rejects(readStoryStream(response(new TextEncoder().encode('event: delta\ndata: garbage\n\n'),1),()=>{}),SyntaxError);
  console.log('PASS: every byte boundary, UTF-8, CRLF, early EOF, server error, invalid JSON');
})();

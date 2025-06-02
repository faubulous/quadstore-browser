import './setimmediate.js';
import { DataFactory, RdfStore, Engine } from './bundle.js';

let then = Date.now();

const log = (message: string) => {
  const now = Date.now();
  console.log('%s %s +%sms', new Date().toISOString(), message, now - then);
  then = now;
};

const executeQuery = async (engine: Engine, queryStr: string) => {
  log(`Executing query: ${queryStr}`);

  const query = await engine.query(queryStr, { unionDefaultGraph: true });

  if (query.resultType !== 'bindings') {
    throw new Error(`Unexpected result type: ${query.resultType}`);
  }

  const bindingsStream = await query.execute();
  const bindings = await (bindingsStream as any).toArray();

  log(`Query executed, found ${bindings.length} bindings`);

  return bindings;
};

const main = async () => {

  log('Welcome!');

  const dataFactory = new DataFactory();
  log('Data factory instantiated');

  // const store = new Quadstore({
  //   dataFactory,
  //   backend: new BrowserLevel('quadstore'),
  // });
  const store = RdfStore.createDefault();
  log('Store instantiated');

  const engine = new Engine(store as any);
  log('Query engine instantiated');

  // await store.open();
  // log('Store opened');

  // await store.clear();
  // log('Store cleared');

  const qty = 200_000;
  const source_quads = new Array(qty).fill(true).map((_, i) => dataFactory.quad(
    dataFactory.namedNode(`ex://s${i}`),
    dataFactory.namedNode(`ex://p${i}`),
    dataFactory.namedNode(`ex://o${i}`),
    dataFactory.namedNode(`ex://g${i % 1000}`),
  ));

  source_quads.forEach(q => store.addQuad(q));

  log('Added 200k quads to the store');

  const results1 = await executeQuery(engine, 'SELECT * WHERE { GRAPH ?g { ?s ?p ?o . } } LIMIT 100');

  if (results1.length !== 100) {
    throw new Error(`Expected 100 bindings, got ${results1.length}`);
  }

  const results2 = await executeQuery(engine, 'SELECT * WHERE { ?s ?p ?o . } LIMIT 100');

  if (results2.length !== 100) {
    throw new Error(`Expected 100 bindings, got ${results2.length}`);
  }

  // await store.close();
  // log('Store closed');
};

main().catch(console.error);

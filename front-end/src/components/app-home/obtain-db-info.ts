const sqliteWorkerUrl = './assets/sqljs/worker.sql-wasm.js';
const sqliteActionIdAndResolveMap = new Map<string, (value: any) => void>();
const dbWorker = new Worker(sqliteWorkerUrl);

export async function obtainDbInfo(dbBuffer: ArrayBuffer) {
  dbWorker.addEventListener('message', ({ data }) => {
    const resolve = sqliteActionIdAndResolveMap.get(data.id.identifier);
    resolve?.(data);
    sqliteActionIdAndResolveMap?.delete(data.id.identifier);
  });
  const dbReady = (
    await runSqlAction(dbWorker, {
      action: 'open',
      buffer: dbBuffer,
    })
  )?.ready;
  if (dbReady) {
    let result = '';
    result += '===Info===\n';
    let [queryResult] = (await execSql(dbWorker, 'select label, value from info')) || [];
    result += queryResult.values?.map(([label, value]) => `${label}:\t${value}`).join('\n');
    result += '\n===Variables===\n';
    [queryResult] = (await execSql(dbWorker, 'select name, unit, description from variable')) || [];
    result += 'Name\tUnit\tDescription\n';
    result += queryResult.values?.map(([name, unit, description]) => `${name}\t${unit}\t${description}`).join('\n');
    return result;
  }
  return '';
}

async function execSql(dbWorker: Worker, sql: string, params?: any) {
  return (
    await runSqlAction(dbWorker, {
      action: 'exec',
      sql,
      params,
    })
  ).results;
}

function runSqlAction(dbWorker: Worker, command: any) {
  const timeout = 20000;
  return new Promise<any>((resolve, reject) => {
    let id: string;
    do {
      id = Math.random().toString();
    } while (sqliteActionIdAndResolveMap.has(id));
    sqliteActionIdAndResolveMap.set(id, resolve);
    dbWorker?.postMessage({
      ...command,
      id: {
        identifier: id,
        action: command.action,
      },
    });
    setTimeout(() => {
      reject('action timeout');
    }, timeout);
  });
}

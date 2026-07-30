import { app, InvocationContext } from '@azure/functions';
import { TransactionAcceptedConsumer } from 'api/src/modules/scoring/consumers/TransactionAcceptedConsumer.js';
import { ScoringEngine } from 'api/src/modules/scoring/services/ScoringEngine.js';
import { MemoryTransactionRepository } from 'api/src/modules/ingestion/repositories/MemoryTransactionRepository.js';

export async function procesarTransaccionHandler(queueItem: unknown, context: InvocationContext): Promise<void> {
    const evento = queueItem as any;
    context.log(`Procesando transacción para cuenta: ${evento.accountId}`);

    const repository = new MemoryTransactionRepository();
    const scoringEngine = new ScoringEngine({});
    const consumer = new TransactionAcceptedConsumer(scoringEngine, repository);

    try {
        await consumer.handle(evento);
        context.log('Transacción procesada correctamente');
    } catch (error) {
        context.error('Error procesando la transacción: ', error);
        throw error;
    }
}

app.storageQueue('procesarTransaccionTrigger', {
    queueName: 'ingesta-transacciones',
    connection: 'AzureWebJobsStorage',
    handler: procesarTransaccionHandler
});

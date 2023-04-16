import * as express from 'express';
import { Request, Response } from 'express';
import * as cors from 'cors';
import { createConnection } from 'typeorm'
import { Product } from './entity/product';
import * as amqp from 'amqplib/callback_api';

createConnection().then(db => {
    const productRepository = db.getRepository(Product);
    
    amqp.connect('amqps://rsbozcyr:XDoJ_MDnkPqvTlJ0WJQdMPTj2FajyVQ-@toad.rmq.cloudamqp.com/rsbozcyr', (error0, connection) => {
        if (error0) {
            throw error0;
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1;
            }

            const app = express();

            app.use(cors());
            app.use(express.json());

            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find();
                
                res.json(products);
            });

            app.post('/api/products', async (req: Request, res: Response) => {
                const product = productRepository.create(req.body);
                const result = await productRepository.save(product);
                channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)));
                return res.send(result)
            });

            app.get('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOneBy({ id: req.params.id });

                return res.send(product);
            });

            app.put('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOneBy({ id: req.params.id });
                productRepository.merge(product, req.body);

                const result = await productRepository.save(product);
                
                channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)));
                return res.send(result);
            });

            app.delete('/api/products/:id', async (req: Request, res: Response) => {
                const result = await productRepository.delete(req.params.id);
                
                channel.sendToQueue('product_deleted', Buffer.from(JSON.stringify(req.params.id)));
                return res.send(result);
            });
            
            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const product = await productRepository.findOneBy({ id: req.params.id });
                product.likes++;

                const result = await productRepository.save(product);
                return res.send(result);
            });

            const PORT = 8000;

            console.log(`Listening to port: ${PORT}`);

            app.listen(PORT);
            process.on('beforeExit', () => {
                console.log('Closing');
                connection.close()
            });
        });
    }); 
});

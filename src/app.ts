import * as express from 'express';
import { Request, Response } from 'express';
import * as cors from 'cors';
import { createConnection } from 'typeorm'
import { Product } from './entity/product';

createConnection().then(db => {
    const productRepository = db.getRepository(Product);
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get('/api/products', async (req: Request, res: Response) => {
        const products = await productRepository.find();

        res.json(products);
    });

    const PORT = 8000;

    console.log(`Listening to port: ${PORT}`);

    app.listen(PORT);
});

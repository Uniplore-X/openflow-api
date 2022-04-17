var wtf = require('wtfnode');
const path = require("path");
const env = path.join(process.cwd(), 'config', '.env');
require("dotenv").config({ path: env }); // , debug: false 
import { suite, test, timeout } from '@testdeck/mocha';
import assert = require('assert');
import { ApiConfig } from '../src/ApiConfig';
import { WebSocketClient, SigninMessage, Message, NoderedUtil } from "../src/index";

@suite class basic_entities {
    private socket: WebSocketClient = null;
    @timeout(500000)
    async before() {
        ApiConfig.log_trafic_verbose = false;
        ApiConfig.log_trafic_silly = false;
        ApiConfig.log_information = false;
        if (!this.socket) this.socket = new WebSocketClient(null, "wss://pc.openiap.io", true);
        // if (!this.socket) this.socket = new WebSocketClient(null, "wss://demo.openiap.io", true, true);
        this.socket.agent = "test-cli";
        await this.socket.Connect();
        await NoderedUtil.SigninWithUsername({ username: "testuser", password: "testuser" });
    }
    @timeout(5000)
    async after() {
        await this.socket.close(1000, "Close by user");
        this.socket.events.removeAllListeners()
        // wtf.dump()
    }
    @timeout(5000)
    @test async 'querytest'() {
        await NoderedUtil.DeleteMany({ query: { "_type": "test" }, collectionname: "entities" });

        let item = await NoderedUtil.InsertOne({ item: { "_type": "test", "name": "test entities item" }, collectionname: "entities" });
        assert.strictEqual(item.name, "test entities item");
        assert.strictEqual(item._type, "test");
        item.name = "test entities item updated"
        item = await NoderedUtil.UpdateOne({ item: item, collectionname: "entities" });
        assert.strictEqual(item.name, "test entities item updated");

        let items = await NoderedUtil.Query({ query: { "_type": "test" }, collectionname: "entities", top: 100 });
        assert.strictEqual(items.length, 1);
        item = items[0];
        assert.strictEqual(item.name, "test entities item updated");

        await NoderedUtil.DeleteOne({ id: item._id, collectionname: "entities" });

        items = await NoderedUtil.Query({ query: { "_type": "test" }, collectionname: "entities", top: 100 });
        assert.strictEqual(items.length, 0);

        items = [];
        items.push({ name: "test item 1", "_type": "test" });
        items.push({ name: "test item 2", "_type": "test" });
        items.push({ name: "test item 3", "_type": "test" });
        items.push({ name: "test item 4", "_type": "test" });
        items.push({ name: "test item 5", "_type": "test" });
        items = await NoderedUtil.InsertMany({ items: items, collectionname: "entities", skipresults: false });
        assert.strictEqual(items.length, 5);
        for (var i = 0; i < items.length; i++) {
            item = items[i];
            assert.notStrictEqual(["test item 1", "test item 2", "test item 3", "test item 4", "test item 5"].indexOf(item.name), -1, "Failed matching name on item");
            assert.strictEqual(item._type, "test");
            assert.notStrictEqual(item._created, undefined);
            assert.notStrictEqual(item._created, null);
        }
        items = await NoderedUtil.Query({ query: { "_type": "test" }, collectionname: "entities", top: 100 });
        assert.strictEqual(items.length, 5);
        for (var i = 0; i < items.length; i++) {
            item = items[i];
            assert.notStrictEqual(["test item 1", "test item 2", "test item 3", "test item 4", "test item 5"].indexOf(item.name), -1, "Failed matching name on item");
            assert.strictEqual(item._type, "test");
            assert.notStrictEqual(item._created, undefined);
            assert.notStrictEqual(item._created, null);
        }

        items = await NoderedUtil.Query({ query: { "_type": "test" }, collectionname: "entities", top: 100 });
        let ids = items.map(x => x._id);
        if (ids.length > 0) await NoderedUtil.DeleteMany({ ids, collectionname: "entities" });

        items = await NoderedUtil.Query({ query: { "_type": "test" }, collectionname: "entities", top: 100 });
        assert.strictEqual(items.length, 0, "Failed cleaning up");
    }
}
// cls | ts-mocha --paths -p test/tsconfig.json .\test\basic_entities.test.ts
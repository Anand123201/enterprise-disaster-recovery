
jest.mock("pg", () => ({
    Pool: jest.fn(() => ({
        query: jest.fn()
    }))
}));

const request = require("supertest");
const { app, pool } = require("../app");

describe("Enterprise Disaster Recovery API Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 1: Health endpoint
    test("GET /health should return healthy status", async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("healthy");
        expect(response.body.database).toBe("connected");
    });

    // Test 2: Database failure
    test("GET /health should return 503 when database fails", async () => {
        pool.query.mockRejectedValue(new Error("Database unavailable"));

        const response = await request(app).get("/health");

        expect(response.status).toBe(503);
        expect(response.body.status).toBe("unhealthy");
    });

    // Test 3: Fetch records
    test("GET /records should return database records", async () => {
        pool.query.mockResolvedValue({
            rows: [
                { id: 1, name: "Backup Test" }
            ]
        });

        const response = await request(app).get("/records");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe("Backup Test");
    });

    // Test 4: Insert record
    test("POST /records should create a record", async () => {
        pool.query.mockResolvedValue({
            rows: [
                { id: 4, name: "Test Record", description: "Jest testing" }
            ]
        });

        const response = await request(app)
            .post("/records")
            .send({
                name: "Test Record",
                description: "Jest testing"
            });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe("Test Record");
    });

});

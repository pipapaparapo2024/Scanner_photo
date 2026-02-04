/**
 * Integration tests for /api/scans routes
 * Mocks auth (Firebase) and scan/user services to test HTTP layer
 */

import request from "supertest";
import app from "../../app";
import * as scanService from "../../services/scanService";
import { NoCreditsError } from "../../utils/errors";

jest.mock("../../config/firebase", () => ({
  auth: {
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: "test-uid-123",
      email: "test@example.com",
    }),
  },
  firestore: {},
}));

jest.mock("../../services/scanService");

const mockScanService = scanService as jest.Mocked<typeof scanService>;

describe("GET /api/scans", () => {
  it("returns 200 and list when authenticated", async () => {
    mockScanService.listScans.mockResolvedValue([
      {
        scanId: "s1",
        scanDate: new Date().toISOString(),
        extractedText: "Hello",
      },
    ]);

    const res = await request(app)
      .get("/api/scans")
      .set("Authorization", "Bearer valid-token")
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ scanId: "s1", extractedText: "Hello" });
    expect(mockScanService.listScans).toHaveBeenCalledWith(
      "test-uid-123",
      20,
      0
    );
  });

  it("returns 401 when no Authorization header", async () => {
    await request(app).get("/api/scans").expect(401);
    expect(mockScanService.listScans).not.toHaveBeenCalled();
  });
});

describe("POST /api/scans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 and scan when user has credits", async () => {
    const scan = {
      scanId: "new-scan",
      scanDate: new Date().toISOString(),
      extractedText: "Recognized text",
    };
    mockScanService.performScan.mockResolvedValue({
      scan,
      remainingCredits: 4,
    });

    const res = await request(app)
      .post("/api/scans")
      .set("Authorization", "Bearer valid-token")
      .send({ extractedText: "Recognized text" })
      .expect(200);

    expect(res.body).toMatchObject({
      scan: { scanId: "new-scan", extractedText: "Recognized text" },
      remainingCredits: 4,
    });
    expect(mockScanService.performScan).toHaveBeenCalledWith(
      "test-uid-123",
      "test@example.com",
      "Recognized text"
    );
  });

  it("returns 402 when user has no credits", async () => {
    mockScanService.performScan.mockRejectedValue(new NoCreditsError());

    const res = await request(app)
      .post("/api/scans")
      .set("Authorization", "Bearer valid-token")
      .send({ extractedText: "Some text" })
      .expect(402);

    expect(res.body).toMatchObject({
      error: "NO_CREDITS",
      message: expect.any(String),
    });
  });

  it("returns 400 when extractedText is missing", async () => {
    const res = await request(app)
      .post("/api/scans")
      .set("Authorization", "Bearer valid-token")
      .send({})
      .expect(400);

    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(mockScanService.performScan).not.toHaveBeenCalled();
  });
});

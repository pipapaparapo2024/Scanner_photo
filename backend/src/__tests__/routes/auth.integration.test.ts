/**
 * Integration tests for /api/auth routes
 * Mocks Firestore and email service
 */

import request from "supertest";
import app from "../../app";

const mockSet = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockResolvedValue(undefined);

const mockWhereGet = jest.fn().mockResolvedValue({
  docs: [
    {
      id: "code-1",
      data: () => ({
        email: "user@example.com",
        code: "1234",
        createdAt: { toDate: () => new Date() },
        expiresAt: { toDate: () => new Date(Date.now() + 10 * 60 * 1000) },
      }),
    },
  ],
});

const mockWhereChain = jest.fn().mockReturnValue({
  where: jest.fn().mockReturnValue({ get: mockWhereGet }),
});

jest.mock("../../config/firebase", () => ({
  auth: {},
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: mockSet,
        delete: mockDelete,
      })),
      where: mockWhereChain,
    })),
  },
}));

jest.mock("../../services/emailService", () => ({
  sendVerificationCodeEmail: jest.fn().mockResolvedValue(undefined),
}));

describe("POST /api/auth/send-verification-code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/send-verification-code")
      .send({})
      .expect(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when email format is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/send-verification-code")
      .send({ email: "not-an-email" })
      .expect(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
  });

  it("returns 200 when email is valid", async () => {
    const res = await request(app)
      .post("/api/auth/send-verification-code")
      .send({ email: "user@example.com" })
      .expect(200);
    expect(res.body).toMatchObject({ success: true });
    expect(mockSet).toHaveBeenCalled();
  });
});

describe("POST /api/auth/verify-code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWhereGet.mockResolvedValue({
      docs: [
        {
          id: "code-1",
          data: () => ({
            email: "user@example.com",
            code: "1234",
            createdAt: { toDate: () => new Date() },
            expiresAt: { toDate: () => new Date(Date.now() + 10 * 60 * 1000) },
          }),
        },
      ],
    });
  });

  it("returns 400 when email or code is missing", async () => {
    await request(app)
      .post("/api/auth/verify-code")
      .send({})
      .expect(400);
  });

  it("returns 200 when code is valid", async () => {
    const res = await request(app)
      .post("/api/auth/verify-code")
      .send({ email: "user@example.com", code: "1234" })
      .expect(200);
    expect(res.body).toMatchObject({ success: true });
  });
});

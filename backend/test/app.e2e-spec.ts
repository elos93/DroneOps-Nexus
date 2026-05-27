import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }: { body: { service: string; status: string } }) => {
        expect(body.service).toBe('DroneOps Nexus API');
        expect(body.status).toBe('online');
      });
  });

  it('runs the WPF-style delivery and charging workflow', async () => {
    const sender = {
      id: 'CU-900',
      name: 'Test Sender',
      phone: '050-9000001',
      email: 'sender@example.com',
      location: { latitude: 32.08, longitude: 34.79, label: 'Sender Base' },
    };
    const target = {
      id: 'CU-901',
      name: 'Test Recipient',
      phone: '050-9000002',
      email: 'target@example.com',
      location: { latitude: 32.09, longitude: 34.81, label: 'Target Base' },
    };

    await request(app.getHttpServer())
      .post('/api/operations/customers')
      .send(sender)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/customers')
      .send(target)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/stations')
      .send({
        id: 'ST-900',
        name: 'Test Charging Hub',
        totalSlots: 2,
        location: { latitude: 32.07, longitude: 34.78, label: 'Hub' },
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/drones')
      .send({
        id: 'DX-900',
        model: 'Test Lift',
        battery: 80,
        maxPayloadKg: 5,
        location: { latitude: 32.07, longitude: 34.78, label: 'Hub' },
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/missions')
      .send({
        id: 'MS-900',
        senderCustomerId: sender.id,
        targetCustomerId: target.id,
        payloadKg: 2,
        priority: 'urgent',
        etaMinutes: 15,
      })
      .expect(201)
      .expect(
        ({ body }: { body: { trackingCode: string; timeline: unknown[] } }) => {
          expect(body.trackingCode).toBe('TRACK-MS900');
          expect(body.timeline).toHaveLength(1);
        },
      );

    await request(app.getHttpServer())
      .post('/api/operations/missions/MS-900/assign')
      .send({ droneId: 'DX-900' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/missions/MS-900/pickup')
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/missions/MS-900/deliver')
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/drones/DX-900/charge')
      .send({ stationId: 'ST-900' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/drones/DX-900/release-charge')
      .send({ minutes: 10 })
      .expect(201)
      .expect(({ body }: { body: { status: string; battery: number } }) => {
        expect(body.status).toBe('available');
        expect(body.battery).toBeGreaterThan(60);
      });

    await request(app.getHttpServer())
      .get('/api/operations/tracking/MS-900')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            mission: {
              progressPercent: number;
              timeline: unknown[];
              proofOfDeliveryCode?: string;
            };
            demoConfirmationCode?: string;
          };
        }) => {
          expect(body.mission.progressPercent).toBe(100);
          expect(body.mission.timeline).toHaveLength(4);
          expect(body.mission.proofOfDeliveryCode).toBeUndefined();
          expect(body.demoConfirmationCode).toBeDefined();
        },
      );

    await request(app.getHttpServer())
      .post('/api/operations/drones/DX-900/service')
      .expect(201)
      .expect(({ body }: { body: { batteryHealth: number } }) => {
        expect(body.batteryHealth).toBe(100);
      });

    let proofCode = '';
    await request(app.getHttpServer())
      .post('/api/operations/missions')
      .send({
        id: 'MS-901',
        senderCustomerId: sender.id,
        targetCustomerId: target.id,
        payloadKg: 1,
        priority: 'standard',
        etaMinutes: 8,
      })
      .expect(201)
      .expect(({ body }: { body: { proofOfDeliveryCode: string } }) => {
        proofCode = body.proofOfDeliveryCode;
      });

    await request(app.getHttpServer())
      .post('/api/operations/missions/MS-901/assign')
      .send({ droneId: 'DX-900' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/missions/MS-901/simulate-step')
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/operations/missions/MS-901/confirm-delivery')
      .send({ code: proofCode })
      .expect(201)
      .expect(({ body }: { body: { status: string } }) => {
        expect(body.status).toBe('delivered');
      });

    await request(app.getHttpServer())
      .get('/api/operations/recommendations/MS-207')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: Array<{ score: number; drone: { batteryHealth: number } }>;
        }) => {
          expect(body.length).toBeGreaterThan(0);
          expect(body[0].score).toBeGreaterThan(0);
          expect(body.every((item) => item.drone.batteryHealth >= 82)).toBe(
            true,
          );
        },
      );

    await request(app.getHttpServer())
      .post('/api/operations/drones/DX-18/emergency-return')
      .expect(201)
      .expect(({ body }: { body: { activeMissionId?: string } }) => {
        expect(body.activeMissionId).toBeUndefined();
      });

    await request(app.getHttpServer())
      .get('/api/operations/tracking/MS-204')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            mission: { status: string; timeline: Array<{ title: string }> };
          };
        }) => {
          expect(body.mission.status).toBe('pending');
          expect(body.mission.timeline.at(-1)?.title).toBe(
            'Emergency return initiated',
          );
        },
      );

    await request(app.getHttpServer())
      .get('/api/operations/overview')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { customers: Array<{ id: string }>; auditEvents: unknown[] };
        }) => {
          expect(
            body.customers.some((customer) => customer.id === sender.id),
          ).toBe(true);
          expect(body.auditEvents.length).toBeGreaterThan(0);
        },
      );
  });

  afterEach(async () => {
    await app.close();
  });
});

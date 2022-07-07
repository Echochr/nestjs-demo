import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserDto } from '../src/auth/dto';

describe('AppModule e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(4000);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:4000');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: UserDto = {
      email: 'john.doe@gmail.com',
      password: 'letmein',
    };

    describe('Signup', () => {
      it('should throw a BadRequestException if email is invalid', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: 'john.doe',
            password: dto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw a BadRequestException if password is invalid', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
            password: 123, // both email and password expect a string
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw a BadRequestException if no dto provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED);
      });

      it('should throw a BadRequestException if email is already taken', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Signin', () => {
      it('should throw a BadRequestException if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw a BadRequestException if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw a BadRequestException if no dto provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(HttpStatus.BAD_REQUEST);
      });

      it('should throw a NotFoundException if no user is found', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: 'usernotexist@gmail.com',
            password: dto.password,
          })
          .expectStatus(HttpStatus.NOT_FOUND);
      });

      it('should throw an UnauthorizedException if password is incorrect', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
            password: 'incorrect_password',
          })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get current user profile', () => {
      it.todo('should get current user profile');
    });

    describe('Update user', () => {
      it.todo('should update user');
    });
  });

  describe('Bookmarks', () => {
    describe('Create bookmark', () => {
      it.todo('should create bookmark');
    });
    describe('Get all bookmarks', () => {
      it.todo('should get all bookmarks');
    });
    describe('Get bookmark by id', () => {
      it.todo('should get bookmark by id');
    });
    describe('Update bookmark by id', () => {
      it.todo('should update bookmark by id');
    });
    describe('Delete bookmark by id', () => {
      it.todo('should delete bookmark by id');
    });
  });
});

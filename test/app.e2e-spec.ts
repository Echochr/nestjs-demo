import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserDto } from '../src/auth/dto';
import { UpdateUserDto } from '../src/user/dto';
import { CreateBookmarkDto, UpdateBookmarkDto } from '../src/bookmark/dto';

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
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains('email must be an email');
      });

      it('should throw a BadRequestException if password is invalid', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
            password: 123, // both email and password expect a string
          })
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains('password must be a string');
      });

      it('should throw a BadRequestException if no dto provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains('email should not be empty')
          .expectBodyContains('password should not be empty');
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
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains('Email has already been taken');
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
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains('email should not be empty');
      });

      it('should throw a BadRequestException if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains('password should not be empty');
      });

      it('should throw a BadRequestException if no dto provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBodyContains('email should not be empty')
          .expectBodyContains('password should not be empty');
      });

      it('should throw a NotFoundException if no user is found', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: 'usernotexist@gmail.com',
            password: dto.password,
          })
          .expectStatus(HttpStatus.NOT_FOUND)
          .expectBodyContains('User not found');
      });

      it('should throw an UnauthorizedException if password is incorrect', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
            password: 'incorrect_password',
          })
          .expectStatus(HttpStatus.UNAUTHORIZED)
          .expectBodyContains('Password incorrect');
      });

      it('should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('access_token')
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get current user profile', () => {
      it('should throw an UnauthorizedException if no valid Bearer token is provided', () => {
        return pactum
          .spec()
          .get('/users/profile')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });

      it('should return the current user profile', () => {
        return pactum
          .spec()
          .get('/users/profile')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(HttpStatus.OK);
      });
    });

    describe('Update user', () => {
      it('should update user', () => {
        const dto: UpdateUserDto = {
          firstName: 'John',
          email: 'john.doe.updated@gmail.com',
        };
        return pactum
          .spec()
          .put('/users')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should return an empty array of bookmarks initially', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://google.com',
      };

      it('should create a bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get all bookmarks', () => {
      it('should get all bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });
    });
    describe('Update bookmark by id', () => {
      const dto: UpdateBookmarkDto = {
        title: 'Google.com',
        description: 'Google.com. The most popular search engine',
      };

      it('should throw a NotFoundException if no bookmark is found', () => {
        return pactum
          .spec()
          .put('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withPathParams('id', '9999')
          .withBody(dto)
          .expectStatus(HttpStatus.NOT_FOUND)
          .expectBodyContains('Bookmark not found');
      });

      it.todo(
        'should throw a ForbiddenException if current user does not own the bookmark',
      );

      it('should update bookmark by id', () => {
        return pactum
          .spec()
          .put('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should throw a NotFoundException if no bookmark is found', () => {
        return pactum
          .spec()
          .put('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withPathParams('id', '9999')
          .expectStatus(HttpStatus.NOT_FOUND)
          .expectBodyContains('Bookmark not found');
      });

      it.todo(
        'should throw a ForbiddenException if current user does not own the bookmark',
      );

      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should return an empty array of bookmarks finally', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });
  });
});

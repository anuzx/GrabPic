## Api endpoints

1. `GET /auth/google` - (done)
2. `GET /auth/google/callback`- (done)
3. `GET /auth/github`- (done)
4. `GET /auth/github/callback`- (done)
5. `POST /api/events` — create event- (done)
6. `GET /api/events` — list of events joined by user- (done)
7. `POST /api/events/join` — join event- (done)
8. `GET /api/events/:eventId` — get event by its id- (done)
9. `DELETE /api/events/:eventId` — (owner only) delete event + cascade all photos/members -(done)
10. `POST /api/events/:eventId/leave`  — (members only) remove self from event memberships -(done)
11. `GET /api/events/:eventId/photos?cursor=<lastPhotoId>` — returns all the photos of the event in pagination manner -(done) 
9. `POST /api/events/:eventId/photos/upload` — upload photos 
10. `POST /api/events/:eventId/photos/search` — upload selfie -> send to ai-service -> return matched photo ids

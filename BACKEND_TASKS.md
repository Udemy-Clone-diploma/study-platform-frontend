# Backend tasks for the course-detail page

This document lists every Django REST backend change needed to support the `/courses/{slug}` frontend page and the next three user stories. Each task is self-contained. Implement them in priority order.

The existing `GET /courses/{slug}/` endpoint already returns a `CourseDetail` object. The frontend type for `CourseDetail` is defined in `src/entities/course/model/types.ts`. All new fields listed below must appear in the `CourseDetailSerializer`.

---

## Priority 1 — unblocks the current page

### TASK 1: Add `currency` field to Course

**Why:** The frontend formats prices via `Intl.NumberFormat`. Right now it hardcodes USD. The Figma mock uses EUR. We need a per-course currency.

**What to do:**
1. Add `currency = models.CharField(max_length=3, default="USD")` to the `Course` model. Choices: `"USD"`, `"EUR"`, `"UAH"`.
2. Expose `currency` in `CourseListSerializer` and `CourseDetailSerializer`.
3. Create and run migration.

**Expected serializer output:**
```json
{ "currency": "EUR" }
```

---

### TASK 2: Add `subtitle` field to Course

**Why:** Figma shows a short tagline under the title ("From Logic to Visual Excellence"). Not in the current model.

**What to do:**
1. Add `subtitle = models.CharField(max_length=255, blank=True, null=True)` to `Course`.
2. Expose `subtitle` in `CourseDetailSerializer` only (not the list serializer).
3. Create and run migration.

**Expected serializer output:**
```json
{ "subtitle": "From Logic to Visual Excellence" }
```

---

### TASK 3: Add enrollment status to authenticated CourseDetail response

**Why:** The "Get Started" CTA on the frontend does nothing for logged-in users currently. We need to know if the user is already enrolled to switch button state to "Continue learning" or "Already enrolled".

**What to do:**
1. In `CourseDetailSerializer`, add a `SerializerMethodField` named `is_enrolled`.
2. The method checks `Enrollment.objects.filter(user=request.user, course=obj).exists()`. Return `False` for anonymous users.
3. Expose `is_enrolled` in the response.

**Expected serializer output:**
```json
{ "is_enrolled": false }
```

---

### TASK 4: Add enrollment endpoint

**Why:** The "Get Started" / "Buy now" CTAs need to call an endpoint to create an enrollment.

**What to do:**
1. Create `POST /courses/{slug}/enroll/` view.
2. Requires authentication (return 401 if not logged in).
3. Return 201 on success with `{ "status": "enrolled" }`.
4. Return 409 if already enrolled with `{ "detail": "Already enrolled." }`.
5. Return 402 if the course is paid and payment is not handled yet, with `{ "detail": "Payment required." }`. (Placeholder — full payment flow is a separate task.)
6. Wire up URL.

---

### TASK 5: Serve `image` field as absolute URL

**Why:** `Course.image` exists but the frontend uses `next/image`, which requires a fully qualified URL or an absolute path. Local dev often returns a relative path like `/media/courses/foo.png`, which breaks on the frontend.

**What to do:**
1. In `CourseListSerializer` and `CourseDetailSerializer`, make sure `image` is serialized via `serializers.ImageField(use_url=True)` or the `request.build_absolute_uri` pattern so it returns `http://localhost:8000/media/...`.
2. Confirm the `MEDIA_URL` setting and `DEFAULT_FILE_STORAGE` are configured for the deployed environment.
3. Return `null` when no image is set (not an empty string).

---

## Priority 2 — unblocks lesson previews (next Jira story)

### TASK 6: Add `is_preview` to Lesson

**Why:** The course detail page shows a lock/unlock icon per lesson. Unlocked lessons (`is_preview: true`) are clickable for non-enrolled users and open the lesson player as a free sample.

**What to do:**
1. Add `is_preview = models.BooleanField(default=False)` to the `Lesson` model.
2. Expose `is_preview` in `LessonSerializer` (nested inside `ModuleSerializer`).
3. Create and run migration.

**Expected serializer output (per lesson):**
```json
{ "id": 1, "title": "...", "order": 1, "duration_minutes": 45, "is_preview": true }
```

---

### TASK 7: Add lesson detail endpoint with access control

**Why:** Clicking a preview lesson should open the full lesson content. Enrolled users can access all lessons. Non-enrolled users can only access lessons where `is_preview: true`.

**What to do:**
1. Create `GET /courses/{slug}/lessons/{lesson_id}/` endpoint.
2. Access rules:
   - If `lesson.is_preview` is `true`: return lesson content to everyone (authenticated or not).
   - If `lesson.is_preview` is `false`: require authentication AND enrollment; return 403 otherwise.
3. Response shape:
```json
{
  "id": 1,
  "title": "Introduction to the European Design Ecosystem",
  "order": 1,
  "duration_minutes": 45,
  "is_preview": true,
  "content_type": "video",
  "video_url": "https://...",
  "body_html": null
}
```
4. `content_type` is `"video"` or `"text"`. Use whichever fits your lesson model.
5. Wire up URL.

---

## Priority 3 — unblocks student reviews (next Jira story)

### TASK 8: Create Review model and endpoints

**Why:** The course detail page needs a reviews section. The `rating_avg` field already exists on Course, but there is no way to display individual reviews or submit new ones.

**What to do:**

1. Create a `Review` model:
```python
class Review(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="reviews")
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("course", "student")
```

2. Create serializer:
```json
{
  "id": 1,
  "student": { "id": 5, "name": "John Doe", "avatar": "https://..." },
  "rating": 5,
  "text": "Excellent course.",
  "created_at": "2026-01-20T10:00:00Z"
}
```

3. Create endpoints:
   - `GET /courses/{slug}/reviews/` — paginated, public, same `{ count, next, previous, results }` shape used everywhere else. Default ordering: `-created_at`.
   - `POST /courses/{slug}/reviews/` — authenticated + enrolled only. Return 403 for non-enrolled. Return 409 if review already exists.

4. Add `rating_count: int` to `CourseDetailSerializer` (count of approved reviews). This lets the frontend show "(120 reviews)" without a second request.

5. Update `rating_avg` to recompute automatically on review save/delete (use a signal or override `save`).

6. Create and run migration.

---

## Priority 4 — unblocks cohort schedule card (in page now, data stubbed)

### TASK 9: Create Cohort model and link to CourseDetail

**Why:** The frontend schedule card renders cohort data (`duration_months`, `hours_per_week_min/max`, `group_size`, `delivery_mode`, `start_date`). Currently the frontend uses mock data for this. The backend needs a real model.

**What to do:**

1. Create a `Cohort` model:
```python
class Cohort(models.Model):
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name="cohort")
    duration_months = models.PositiveSmallIntegerField()
    hours_per_week_min = models.PositiveSmallIntegerField()
    hours_per_week_max = models.PositiveSmallIntegerField()
    group_size = models.PositiveSmallIntegerField(null=True, blank=True)
    delivery_mode = models.CharField(
        max_length=20,
        choices=[("group", "Group"), ("individual", "Individual"), ("both", "Both")],
    )
    start_date = models.DateField(null=True, blank=True)
```

2. Create `CohortSerializer`:
```json
{
  "duration_months": 4,
  "hours_per_week_min": 2,
  "hours_per_week_max": 4,
  "group_size": 12,
  "delivery_mode": "both",
  "start_date": "2026-01-15"
}
```

3. Nest `CohortSerializer` in `CourseDetailSerializer` as `cohort`. Return `null` when no cohort is linked.

4. Create and run migration.

---

## Priority 5 — unblocks two-tier pricing (in page now, data stubbed)

### TASK 10: Create PricingPlan model and link to CourseDetail

**Why:** The frontend pricing block renders two plan cards ("Group Courses" / "Individual Coaching"), each with its own price, currency, and installment plan. The current `Course` model only has a single flat `price` field.

**What to do:**

1. Create a `PricingPlan` model:
```python
class PricingPlan(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="pricing_plans")
    kind = models.CharField(max_length=20, choices=[("group", "Group"), ("individual", "Individual")])
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=[("USD", "USD"), ("EUR", "EUR"), ("UAH", "UAH")])
    installment_count = models.PositiveSmallIntegerField(null=True, blank=True)
    installment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
```

2. Create `PricingPlanSerializer`:
```json
{
  "id": 1,
  "kind": "group",
  "price": "599.00",
  "currency": "EUR",
  "installment_count": 4,
  "installment_amount": "160.00"
}
```

3. In `CourseDetailSerializer`, add `pricing_plans = PricingPlanSerializer(many=True)`. Return an empty list `[]` when no plans exist (not `null`).

4. Create and run migration.

5. Keep the existing flat `price`, `pricing_type`, `installment_count`, `installment_amount` fields on `Course` for backward compatibility with the list serializer and catalog filters. The detail serializer gains the new nested `pricing_plans` in addition.

---

## Priority 6 — unblocks richer teacher block (in page now, data stubbed)

### TASK 11: Extend Teacher/UserProfile with stats and quote

**Why:** The instructor section on the course detail page shows three stats (years_experience, students_taught, partnerships_count) and an optional pull-quote. These fields do not exist yet.

**What to do:**

1. On the teacher's profile model (wherever `TeacherProfile` or the `User` extension lives), add:
```python
years_experience = models.PositiveSmallIntegerField(null=True, blank=True)
students_taught = models.PositiveIntegerField(null=True, blank=True)
partnerships_count = models.PositiveIntegerField(null=True, blank=True)
quote = models.TextField(blank=True, null=True)
```

2. Expose these fields in the teacher serializer nested inside `CourseDetailSerializer`:
```json
{
  "id": 10,
  "name": "Sarah Jenkins",
  "avatar": "https://...",
  "bio": "Senior Product Designer...",
  "years_experience": 10,
  "students_taught": 500,
  "partnerships_count": 300,
  "quote": "Great design is not about making things look pretty..."
}
```

3. Return `null` for all optional fields when not set.

4. Create and run migration.

---

## Cross-cutting requirements (apply to all tasks)

- **Pagination shape:** All list endpoints must return `{ "count": N, "next": "...", "previous": "...", "results": [...] }`. Never return a bare array for paginated data.
- **Null vs empty string:** Return `null` for missing optional fields, never `""`.
- **Image URLs:** All image fields (`image`, `avatar`, `portrait`) must return a fully qualified URL or `null`. Never a relative path.
- **HTML sanitization:** Sanitize `full_description` and any future rich-text fields on write (server side). Do not trust frontend-only sanitization.
- **CORS:** All new endpoints must be accessible from `http://localhost:3000` in development.
- **Authentication:** All write endpoints require a valid JWT access token in the `Authorization: Bearer` header. Read endpoints for public course data are unauthenticated.

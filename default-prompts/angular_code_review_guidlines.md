---
applyTo: '**/*.ts'
---
Coding standards, domain knowledge, and preferences that AI should follow.

# Angular TypeScript Code Review Instructions

> **Scope**: `**/*spec.ts`
> **Note**: Do **not** edit the code. Only review and mark results using ✅ (pass) or ❌ (fail).

### 📌 Review Output Guidelines

- ❌ Do **not** provide additional positive commentary or verbose explanations (e.g., "clean pattern", "appropriate use of operators").
- ✅ Focus **only on the checklist items** provided below.
- ⚠️ If a rule is passed, just mark it with a ✅ and move on — **no need to explain why it passed**.
- ❗ Only explain if a rule is **violated**, and keep the explanation **brief and directly related to the rule**.
- Add the end of the output display number of success, fails and warnings

---

## 📖 TDD Philosophy

**TDD approach focuses on failing the code from the very beginning.**

---

## 🔍 Custom Code PR Review Checklist

### 1. **Avoid Getters/Setters**
- ❌ Never use `get` or `set` accessors.
- ✅ Use plain methods instead of getters or setters.

---

### 2. **Avoid `event.stopPropagation`**
- ❌ Do not use `event.stopPropagation()` anywhere in the code.

---

### 3. ✅ **Performance Optimization Guideline**

When using `if` or `else if` conditions with multiple boolean expressions, always evaluate **variables before method or function calls**.

This helps optimize performance through short-circuit evaluation, as variable checks are cheaper than function calls.

#### ✅ Preferred:
```ts
if (isEnabled && isValidState()) {
    // logic here
}
```

#### ❌ Avoid:
```ts
if (isValidState() && isEnabled) {
    // logic here
}
```

By placing the variable check first, unnecessary function calls are avoided when the condition short-circuits.

---

### 4. ✅ **RxJS Subscription Best Practice**

Always ensure `takeUntil` is the **last operator** in an RxJS `pipe()` chain.
Placing it earlier can lead to incorrect or missed unsubscriptions.

- 🔎 Review all usages of `takeUntil`.
- ❗ If `takeUntil` is **not the last operator**, list those lines explicitly.

#### ✅ Correct Usage:
```ts
this.someService.getData()
  .pipe(
    map(data => data.value),
    takeUntil(this.destroy$)
  )
  .subscribe(result => {
    // handle result
  });
```

#### ❌ Incorrect Usage:
```ts
this.someService.getData()
  .pipe(
    takeUntil(this.destroy$),
    map(data => data.value)
  )
  .subscribe(result => {
    // handle result
  });
```

### 🔄 `takeUntil` Handling in Wrapped/Helper Methods

If a `subscribe()` is made on a method (e.g., `this.methodName().subscribe()`), and that method internally returns an observable that already includes `takeUntil`, it is **not required** to add `takeUntil` again at the point of subscription.

- ✅ In such cases, **do not flag a warning**.
- 🔍 You may need to inspect the returned observable method to confirm `takeUntil` is applied inside it.

Additionally, if a method builds an observable pipeline using `pipe(...)` but there is **no visible subscription** to it, show a ⚠️ **warning** to ensure it is safely handled:

- ⚠️ **Warning**: If such a method is later subscribed in the component class, it **must** include `takeUntil` in its pipe.
- ✅ Alternatively, it should be used in the **template** with the `| async` pipe.

---

#### ✅ Correct Example (takeUntil used inside method and subscribed safely):
```ts
ngOnInit(): void {
  this.smartEditorValueChange$().subscribe(); // Safe if takeUntil is inside the method
}

private smartEditorValueChange$(): Observable<string> {
  return this.someCondition$.pipe(
    switchMap(() => this.someSource$),
    takeUntil(this.destroy$)
  );
}
```

---

#### ❌ Incorrect Example (method returns observable without takeUntil):
```ts
ngOnInit(): void {
  this.wrappedObservable().subscribe(); // Warning: takeUntil missing inside wrappedObservable
}

private wrappedObservable(): Observable<string> {
  return this.someCondition$.pipe(
    switchMap(() => this.someSource$)
  );
}
```

---

#### ⚠️ Warning Example (method defined but not subscribed yet):
```ts
private wrappedObservable(): Observable<string> {
  return this.someCondition$.pipe(
    switchMap(() => this.someSource$)
  );
}
// ⚠️ Warning: This method returns an observable but is not subscribed anywhere.
// → If subscribed in component, make sure to include takeUntil.
// → If used in template, prefer the async pipe.
```

---

## 🧪 Jest Unit Test Guidelines

### 5. **Only One Assertion Per Test**
- ❌ Write only one assertion (`expect`) per test.
- ❌ Do **not** use `&&`, `||` in assertions to combine multiple conditions.
- ✅ If testing multiple things, divide into multiple tests.

#### ❌ Avoid:
```ts
expect(component.A === true && component.B === true || component.C === true).toBeTruthy();
```

#### ✅ Preferred:
```ts
it('should set A to true', () => {
    expect(component.A).toBe(true);
});

it('should set B to true', () => {
    expect(component.B).toBe(true);
});
```

**Reason**: As soon as one assertion fails, the test finishes and remaining assertions are not evaluated. This violates Single Purpose principle.

---

### 6. **Write Tests Only for Public Methods**
- ❌ Do not write tests for `private` or `protected` methods.
- ✅ Test only the public API of your class.
- ✅ Private methods are tested indirectly through public methods.

**Reason**: Coupling unit tests with implementation details is against easing refactorings. If you strongly feel you need to test a private method, it may indicate a code smell suggesting the method belongs to a different class or service.

---

### 7. **Assign Values in beforeEach or Within it/test**
- ❌ Do **not** assign values directly in the `describe` block.
- ❌ Do **not** assign values outside the describe/it tree structure.
- ✅ Assign values in `beforeEach` or within the `it`/`test` itself.

**Reason**: Tests should be independent and run in any random order. There's no guarantee blocks will execute sequentially.

#### ❌ Incorrect:
```ts
describe('example', () => {
    let mockCollaborator: any = jest.fn();
    mockCollaborator.someCall = jest.fn();
    let spy = jest.spyOn(mockCollaborator, 'someCall');
    // ...
});
```

#### ✅ Correct:
```ts
describe('example', () => {
    let sut: Example;
    let mockCollaborator: any;
    let spy: any;
    
    beforeEach(() => {
        mockCollaborator = jest.fn();
        mockCollaborator.someCall = jest.fn();
        spy = jest.spyOn(mockCollaborator, 'someCall');
        sut = new Example(mockCollaborator);
    });
});
```

---

### 8. **Do Not Rely on afterEach/afterAll**
- ❌ Do not use `afterEach`/`afterAll` as critical parts of test flow.
- ✅ Always set up state **before** each test in `beforeEach`.
- ✅ Use `afterEach`/`afterAll` only for cleanup (e.g., closing files).

**Reason**: There's no guarantee a test will reach the `afterEach` hook (process could die), but `beforeEach` is always executed before each test.

---

### 9. **Do Not Use Setup/Teardown Hooks of the Same Type More Than Once Per Level**
- ❌ Do not use multiple `beforeEach`, `beforeAll`, `afterEach`, or `afterAll` per nested level.
- ✅ Use only one hook of each type per `describe` level.

**Reason**: Cannot trust the execution order of multiple hooks of the same type. This damages code review process and makes tests harder to understand.

---

### 10. **Do Not Use Variables as Expected Value**
- ❌ Do not use variables that could mutate as `expectedValue`.
- ✅ Prefer using strings and numbers declared directly in the expected block.
- ✅ If using variables, ensure they're fresh and not reused from system under test inputs.

#### ❌ Incorrect:
```ts
it('should not alter array', () => {
    let numbers: number[] = [1, 2, 3];
    let testClass: TestClass = new TestClass(numbers);
    testClass.isNumberInArray(4);
    expect(testClass['numbersArray']).toEqual(numbers); // numbers may have mutated
});
```

#### ✅ Correct:
```ts
it('should not alter array', () => {
    let numbers: number[] = [1, 2, 3];
    let testClass: TestClass = new TestClass(numbers);
    testClass.isNumberInArray(4);
    expect(testClass['numbersArray']).toEqual([1, 2, 3]); // fresh value
});
```

**Reason**: If you pass the same variable to the system under test and use it in assertion, mutations won't be detected because you're comparing `mutatedValue === mutatedValue`.

---

### 11. **Do Not Re-use Variables as Expected Value**
- ❌ If using a variable as expected value, that variable should be created fresh.
- ❌ Do not reuse any part of it in other areas of the test.

#### ❌ Incorrect (Anti-pattern):
```ts
it('should not alter array', () => {
    const numbers: number[] = [1, 2, 3];
    let testClass: TestClass = new TestClass(numbers);
    testClass.doSomething(numbers); // Reusing numbers
    expect(testClass['numbersArray']).toEqual(numbers); // Cannot trust this
});
```

---

### 12. **Understand the TypeScript Keyword "const"**
- ⚠️ `const` prevents re-assignment but **does not prevent mutation**.
- ⚠️ `const` is a reference/pointer - the values of the object may change.

**Risk**: `const` in test suites can lead to false positives and false negatives because tests or methods under test could mutate the value.

---

### 13. **Time-Related Tests**
- ✅ Unit tests must be deterministic and run everywhere regardless of local timezone.
- ✅ Write date tests with the format `YYYY-MM-DDThh:mm:ss.000Z`.
- ⚠️ Test in multiple timezones: UTC, UTC+23, UTC-23.

#### ✅ Correct (timezone-independent):
```ts
console.log(new Date('2024-01-01T00:00:00.000Z')); // Always same output
```

#### ❌ Incorrect (timezone-dependent):
```ts
console.log(new Date(2024, 0, 1)); // Different output in different timezones
```

---

### 14. **Beware Asynchronous Tests**
- ❌ Do not write synchronous tests that contain asynchronous code.
- ✅ Use `expect.assertions(n)` to verify async assertions are evaluated.
- ✅ Use marble testing instead of subscriptions.

#### ❌ Incorrect (will always pass):
```ts
it('this test should fail', () => {
    timer(0, 1000).pipe(take(1)).subscribe(() => {
        expect(false).toBe(true); // Never evaluated in time
    });
});
```

---

### 15. **Do Not Subscribe in Tests**
- ❌ Do not use subscriptions in tests.
- ✅ Use marble testing instead.
- ✅ Write functions that take base observables as input and return complex observables as output.
- ✅ Code within `subscribe` should be done in `tap` within the observable.

**Reason**: Subscriptions introduce timing issues, potential leaks, and performance degradation. Marble testing uses fake timers and prevents leaks.

#### Exception:
If you must test code within a subscribe and subscription service is used, mock it to trigger the callback:

```ts
mockSubscriptionService = jest.fn();
mockSubscriptionService.subscribe = jest.fn();
let sub: Function = (name: string, ob$: Observable<any>, cb: Function) => { cb; };
jest.spyOn(mockSubscriptionService, 'subscribe').mockImplementation((...args) => sub(...args));
```

---

### 16. **Avoid it.each / test.each**
- ❌ Do not use `it.each` or `test.each`.
- ✅ Write separate explicit tests instead.

**Reasons**:
- Test predicates become harder to read (use variables)
- Harder to ensure test predicates are unique in execution reports
- Easier to duplicate test cases for already-covered partitions
- Verbose test predicates help prevent these hazards

---

### 17. **Ensure @Input Order Does Not Matter (Angular)**
- ✅ Test that `@Input` changes work regardless of the order they're set.
- ✅ Test scenarios where inputs are set in different cycles.

#### ✅ Test Cases to Include:
```ts
it('should calculate when A is given first and B later', () => {
    const firstChange: SimpleChanges = {
        'a': new SimpleChange(null, 'a', true)
    };
    const secondChange: SimpleChanges = {
        'b': new SimpleChange(null, 'b', false)
    };
    component.a = 'a';
    component.ngOnChanges(firstChange);
    component.b = 'b';
    component.ngOnChanges(secondChange);
    expect(component.result).toBe('calculated');
});

it('should calculate when B is given first and A later', () => {
    // Test reverse order
});
```

**Reason**: `@Input` can change at any time and order can change depending on how parent components pass values.

---

### 18. **Use jest.restoreAllMocks() in beforeEach**
- ✅ Call `jest.restoreAllMocks()` at the top of the top-most `beforeEach` block.
- ❌ Do not rely on `afterEach` to clean up.

**Reason**: Prevents dependencies between tests. Never rely on a previous test reaching a cleanup state.

---

### 19. **Do Not Use "of" and "from" in Non-Shallow Unit Tests**
- ✅ Use `of` and `from` only for shallow unit tests where immediate emission is needed.
- ❌ Do not use `of` and `from` for functional tests.
- ✅ Use cold observables as test doubles instead.

**Reason**: `of` and `from` complete immediately, which may not be the expected behavior. They mask timing issues and leaks that cold observables would reveal.

---

### 20. **Do Not Use Conditional Logic or Loops in Tests**
- ❌ No conditional logic (`if`, `else`) in tests.
- ❌ No loops in tests.
- ✅ Tests should have only one execution path.

**Exception**: Allowed in test doubles (mocks) but use with caution.

---

## 🚨 Common Test Anti-Patterns to Flag

### ❌ Multiple Assertions in One Test
```ts
it('should handle timer subscription correctly', () => {
    timer(0, 1000).pipe(take(11)).subscribe((ticks) => {
        component.ngOnInit();
        if (ticks === 2) {
            expect(component.statusMessage).toHaveBeenCalledWith('...');
        }
        if (ticks === 0) {
            expect(window.location.href).toBe('...');
        }
        expect(component.countDownText).toBe(`${10 - ticks}...`);
    });
});
```

**Problems**:
1. Test runs synchronously but code is asynchronous - expects are never evaluated
2. Multiple expects - testing too many things at once
3. Vague predicate ("correctly" doesn't explain what correctness means)
4. Conditional logic makes some assertions execute only under conditions
5. Loop-like behavior with multiple assertions
6. Logic on right side of assertions increases error risk

---

## 🔧 Troubleshooting Common Errors

### NG0304: 'fnd-tag' is not a known element
**Solution**: Declare a mock component with matching selector:
```ts
@Component({
    selector: 'fnd-tag',
    template: ''
})
class MockFndTag {}

TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    declarations: [MyComponent, MockFndTag]
});
```

---

### NG0303: Can't bind to 'ngModel'
**Solution**: Import FormsModule:
```ts
import { FormsModule } from '@angular/forms';

TestBed.configureTestingModule({
    imports: [FormsModule],
    declarations: [MyComponent]
});
```

---

### NG0303: Can't bind to 'ngIf'
**Solution**: Ensure component is declared in TestBed declarations list:
```ts
TestBed.configureTestingModule({
    declarations: [MyComponent] // Component under test must be declared
});
```

---

### NG0302: The pipe 'fndMyPipe' could not be found
**Solution**: Create and declare mock pipe:
```ts
@Pipe({ name: 'fndTranslate' })
class MockTranslatePipe implements PipeTransform {
    public transform(value: string): string {
        return value;
    }
}

TestBed.configureTestingModule({
    declarations: [MyComponent, MockTranslatePipe]
});
```

---

## 📚 Marble Testing Recipes

### Marble Testing for Subjects
```ts
import { TestScheduler } from 'rxjs/testing';

describe('Concept', () => {
    let SUT: Concept;
    let scheduler: TestScheduler;
    
    beforeEach(() => {
        scheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
        SUT = new Concept();
    });
    
    it('should emit when triggered', () => {
        scheduler.run(({ expectObservable }) => {
            expectObservable(SUT.observable$, '----!').toBe(
                '--t--',
                { t: 'Emission' }
            );
            scheduler.schedule(() => { SUT.trigger('Emission') }, 2);
        });
    });
});
```

---


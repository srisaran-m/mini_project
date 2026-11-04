
/* =========================================
   DIGITAL LIBRARY MANAGEMENT SYSTEM
   Weeks 8, 9 and 10
========================================= */

/* ---------- LOCAL STORAGE ---------- */

function loadData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

let books = loadData("books");
let members = loadData("members");
let issues = loadData("issues");

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function saveBooks() {
    saveData("books", books);
}

function saveMembers() {
    saveData("members", members);
}

function saveIssues() {
    saveData("issues", issues);
}

/* ---------- LOGIN SESSION CHECK ---------- */

let userData;

try {
    userData = JSON.parse(localStorage.getItem("user"));
} catch (error) {
    userData = null;
}

if (!userData) {
    window.location.href = "login.html";
} else {
    document.getElementById("userName").textContent =
        "Hello, " + (userData.name || "User");

    document.getElementById("welcomeMessage").textContent =
        "Welcome back, " + (userData.name || "User") +
        "! Here is your library overview.";
}

/* Stop dashboard setup if the login session is missing. */
if (userData) {

/* =========================================
   COMMON HELPERS
========================================= */

const byId = id => document.getElementById(id);

function makeCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value == null ? "" : String(value);
    row.appendChild(cell);
    return cell;
}

function makeButton(text, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
}

function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error-message", isError);
    element.classList.toggle("success-message", !isError);
}

function getBook(bookId) {
    return books.find(book => String(book.bookId) === String(bookId));
}

function getMember(memberId) {
    return members.find(member =>
        String(member.memberId) === String(memberId)
    );
}

function activeIssues() {
    return issues.filter(issue => issue.status === "Issued");
}

function getNextMemberId() {
    if (members.length === 0) return 1;

    const numericIds = members
        .map(member => Number(member.memberId))
        .filter(id => Number.isFinite(id));

    return numericIds.length ? Math.max(...numericIds) + 1 : 1;
}

function getNextIssueId() {
    if (issues.length === 0) return 1;

    const numericIds = issues
        .map(issue => Number(issue.issueId))
        .filter(id => Number.isFinite(id));

    return numericIds.length ? Math.max(...numericIds) + 1 : 1;
}

function formatBookName(issue) {
    const book = getBook(issue.bookId);
    return book ? book.bookName : (issue.bookName || "Book no longer listed");
}

function formatMemberName(issue) {
    const member = getMember(issue.memberId);
    return member ? member.name : (issue.memberName || "Member no longer listed");
}

/* =========================================
   NAVIGATION
========================================= */

const navButtons = document.querySelectorAll(".nav-btn");
const contentSections = document.querySelectorAll(".content-section");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => btn.classList.remove("active"));
        contentSections.forEach(section =>
            section.classList.remove("active-section")
        );

        button.classList.add("active");
        byId(button.dataset.section).classList.add("active-section");

        if (button.dataset.section === "issue") {
            populateIssueOptions();
        }

        if (button.dataset.section === "return") {
            displayReturnRecords();
        }

        if (button.dataset.section === "reports") {
            displayReports();
        }

        updateDashboard();
    });
});

/* =========================================
   BOOK MANAGEMENT
========================================= */

const bookForm = byId("bookForm");
const addBookBox = byId("addBookBox");
const bookTableBody = byId("bookTableBody");
const bookSuccessMessage = byId("successMessage");

let editingBookId = null;

byId("showAddBookBtn").addEventListener("click", () => {
    editingBookId = null;
    bookForm.reset();

    byId("bookId").readOnly = false;
    byId("formTitle").textContent = "Add New Book";
    byId("saveBookBtn").textContent = "Save Book";
    bookSuccessMessage.textContent = "";

    addBookBox.classList.remove("hidden");
});

byId("cancelBookBtn").addEventListener("click", () => {
    editingBookId = null;
    bookForm.reset();
    addBookBox.classList.add("hidden");
    bookSuccessMessage.textContent = "";
});

bookForm.addEventListener("submit", event => {
    event.preventDefault();

    const bookId = byId("bookId").value.trim();
    const bookName = byId("bookName").value.trim();
    const author = byId("author").value.trim();
    const category = byId("category").value.trim();
    const publisher = byId("publisher").value.trim();
    const year = Number(byId("year").value);
    const quantity = Number(byId("quantity").value);

    if (!bookId || !bookName || !author || !category || !publisher) {
        alert("Please fill in all book details.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
        alert("Available quantity must be zero or greater.");
        return;
    }

    if (!Number.isInteger(year) || year < 1) {
        alert("Please enter a valid publication year.");
        return;
    }

    const duplicate = books.some(book =>
        String(book.bookId).toLowerCase() === bookId.toLowerCase() &&
        String(book.bookId) !== String(editingBookId)
    );

    if (duplicate) {
        alert("This Book ID already exists.");
        return;
    }

    const existingBook = editingBookId !== null
        ? getBook(editingBookId)
        : null;

    if (existingBook) {
        const currentlyIssued = activeIssues()
            .filter(issue => String(issue.bookId) === String(editingBookId))
            .length;

        const previousAvailable = Number(existingBook.quantity) || 0;
        const previousTotal = previousAvailable + currentlyIssued;
        const newTotal = quantity + currentlyIssued;

        if (newTotal < currentlyIssued) {
            alert("Quantity cannot be less than the number of issued copies.");
            return;
        }

        Object.assign(existingBook, {
            bookId,
            bookName,
            author,
            category,
            publisher,
            year,
            quantity
        });

        showMessage(bookSuccessMessage, "Book updated successfully!");
    } else {
        books.push({
            bookId,
            bookName,
            author,
            category,
            publisher,
            year,
            quantity
        });

        showMessage(bookSuccessMessage, "Book added successfully!");
    }

    saveBooks();
    displayBooks();
    populateIssueOptions();
    updateDashboard();

    editingBookId = null;
    bookForm.reset();
    byId("bookId").readOnly = false;
    byId("formTitle").textContent = "Add New Book";
    byId("saveBookBtn").textContent = "Save Book";
});

function displayBooks() {
    const searchText = byId("searchBook").value.trim().toLowerCase();
    bookTableBody.replaceChildren();

    const filtered = books.filter(book =>
        [
            book.bookId,
            book.bookName,
            book.author,
            book.category
        ].some(value => String(value || "").toLowerCase().includes(searchText))
    );

    if (filtered.length === 0) {
        const row = bookTableBody.insertRow();
        makeCell(row, "No books found.");
        row.cells[0].colSpan = 8;
        return;
    }

    filtered.forEach(book => {
        const row = bookTableBody.insertRow();

        makeCell(row, book.bookId);
        makeCell(row, book.bookName);
        makeCell(row, book.author);
        makeCell(row, book.category);
        makeCell(row, book.publisher);
        makeCell(row, book.year);
        makeCell(row, book.quantity);

        const actions = row.insertCell();

        actions.appendChild(makeButton("Edit", "edit-btn", () => {
            editingBookId = book.bookId;

            byId("bookId").value = book.bookId;
            byId("bookName").value = book.bookName;
            byId("author").value = book.author;
            byId("category").value = book.category;
            byId("publisher").value = book.publisher;
            byId("year").value = book.year;
            byId("quantity").value = book.quantity;

            byId("bookId").readOnly = true;
            byId("formTitle").textContent = "Edit Book";
            byId("saveBookBtn").textContent = "Update Book";
            bookSuccessMessage.textContent = "";
            addBookBox.classList.remove("hidden");
            addBookBox.scrollIntoView({ behavior: "smooth" });
        }));

        actions.appendChild(makeButton("Delete", "delete-btn", () => {
            const issuedCount = activeIssues()
                .filter(issue => String(issue.bookId) === String(book.bookId))
                .length;

            if (issuedCount > 0) {
                alert("This book cannot be deleted because copies are still issued.");
                return;
            }

            if (!confirm("Delete this book?")) return;

            books = books.filter(item =>
                String(item.bookId) !== String(book.bookId)
            );

            saveBooks();
            displayBooks();
            populateIssueOptions();
            updateDashboard();
        }));
    });
}

byId("searchBook").addEventListener("input", displayBooks);

/* =========================================
   MEMBER MANAGEMENT
========================================= */

const memberForm = byId("memberForm");
const addMemberBox = byId("addMemberBox");
const memberTableBody = byId("memberTableBody");
const memberSuccessMessage = byId("memberSuccessMessage");

let editingMemberId = null;

byId("showAddMemberBtn").addEventListener("click", () => {
    editingMemberId = null;
    memberForm.reset();

    byId("memberId").value = getNextMemberId();
    byId("memberFormTitle").textContent = "Add New Member";
    byId("saveMemberBtn").textContent = "Save Member";
    memberSuccessMessage.textContent = "";

    addMemberBox.classList.remove("hidden");
});

byId("cancelMemberBtn").addEventListener("click", () => {
    editingMemberId = null;
    memberForm.reset();
    addMemberBox.classList.add("hidden");
    memberSuccessMessage.textContent = "";
});

byId("editMemberByIdBtn").addEventListener("click", () => {
    const enteredId = prompt("Enter Member ID to edit:");

    if (enteredId === null) return;

    const member = getMember(enteredId.trim());

    if (!member) {
        alert("Member ID not found.");
        return;
    }

    openMemberForEditing(member);
});

function openMemberForEditing(member) {
    editingMemberId = member.memberId;

    byId("memberId").value = member.memberId;
    byId("memberName").value = member.name;
    byId("department").value = member.department;
    byId("memberEmail").value = member.email;
    byId("mobile").value = member.mobile;

    byId("memberFormTitle").textContent = "Edit Member";
    byId("saveMemberBtn").textContent = "Update Member";
    memberSuccessMessage.textContent = "";

    addMemberBox.classList.remove("hidden");
    addMemberBox.scrollIntoView({ behavior: "smooth" });
}

memberForm.addEventListener("submit", event => {
    event.preventDefault();

    const memberId = byId("memberId").value.trim();
    const name = byId("memberName").value.trim();
    const department = byId("department").value.trim();
    const email = byId("memberEmail").value.trim();
    const mobile = byId("mobile").value.trim();

    if (!/^[A-Za-z ]+$/.test(name)) {
        alert("Name should contain only letters and spaces.");
        return;
    }

    if (!/^[A-Za-z ]+$/.test(department)) {
        alert("Department should contain only letters and spaces.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
        alert("Mobile number must contain exactly 10 digits.");
        return;
    }

    const memberData = { memberId, name, department, email, mobile };

    if (editingMemberId !== null) {
        const existing = getMember(editingMemberId);

        if (!existing) {
            alert("Member could not be found.");
            return;
        }

        Object.assign(existing, memberData);
        showMessage(memberSuccessMessage, "Member updated successfully!");
    } else {
        members.push(memberData);
        showMessage(memberSuccessMessage, "Member added successfully!");
    }

    saveMembers();
    displayMembers();
    populateIssueOptions();
    updateDashboard();

    editingMemberId = null;
    memberForm.reset();
    byId("memberFormTitle").textContent = "Add New Member";
    byId("saveMemberBtn").textContent = "Save Member";
});

function displayMembers() {
    const searchText = byId("searchMember").value.trim().toLowerCase();
    memberTableBody.replaceChildren();

    const filtered = members.filter(member =>
        [
            member.memberId,
            member.name,
            member.department,
            member.email,
            member.mobile
        ].some(value => String(value || "").toLowerCase().includes(searchText))
    );

    if (filtered.length === 0) {
        const row = memberTableBody.insertRow();
        makeCell(row, "No members found.");
        row.cells[0].colSpan = 6;
        return;
    }

    filtered.forEach(member => {
        const row = memberTableBody.insertRow();

        makeCell(row, member.memberId);
        makeCell(row, member.name);
        makeCell(row, member.department);
        makeCell(row, member.email);
        makeCell(row, member.mobile);

        const actions = row.insertCell();

        actions.appendChild(makeButton("Edit", "member-edit-btn", () => {
            openMemberForEditing(member);
        }));

        actions.appendChild(makeButton("Delete", "member-delete-btn", () => {
            const hasActiveIssue = activeIssues().some(issue =>
                String(issue.memberId) === String(member.memberId)
            );

            if (hasActiveIssue) {
                alert("This member has an unreturned book and cannot be deleted.");
                return;
            }

            if (!confirm("Delete member " + member.name + "?")) return;

            members = members.filter(item =>
                String(item.memberId) !== String(member.memberId)
            );

            saveMembers();
            displayMembers();
            populateIssueOptions();
            updateDashboard();
        }));
    });
}

byId("searchMember").addEventListener("input", displayMembers);

byId("mobile").addEventListener("input", event => {
    event.target.value = event.target.value.replace(/[^0-9]/g, "").slice(0, 10);
});

/* =========================================
   WEEK 8: ISSUE BOOK
========================================= */

function populateIssueOptions() {
    const memberSelect = byId("issueMember");
    const bookSelect = byId("issueBook");

    const selectedMember = memberSelect.value;
    const selectedBook = bookSelect.value;

    memberSelect.replaceChildren();
    bookSelect.replaceChildren();

    const memberPlaceholder = document.createElement("option");
    memberPlaceholder.value = "";
    memberPlaceholder.textContent = "Select Member";
    memberSelect.appendChild(memberPlaceholder);

    members.forEach(member => {
        const option = document.createElement("option");
        option.value = member.memberId;
        option.textContent = member.name + " (ID: " + member.memberId + ")";
        memberSelect.appendChild(option);
    });

    const bookPlaceholder = document.createElement("option");
    bookPlaceholder.value = "";
    bookPlaceholder.textContent = "Select Book";
    bookSelect.appendChild(bookPlaceholder);

    books.forEach(book => {
        const option = document.createElement("option");
        option.value = book.bookId;
        option.textContent = book.bookName + " — Available: " + book.quantity;
        option.disabled = Number(book.quantity) <= 0;
        bookSelect.appendChild(option);
    });

    if (members.some(member =>
        String(member.memberId) === String(selectedMember)
    )) {
        memberSelect.value = selectedMember;
    }

    if (books.some(book =>
        String(book.bookId) === String(selectedBook) &&
        Number(book.quantity) > 0
    )) {
        bookSelect.value = selectedBook;
    }
}

function setTodayAsIssueDate() {
    const today = new Date();
    const localDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    byId("issueDate").value = localDate;
    byId("issueDate").min = localDate;
    byId("dueDate").min = localDate;
}

byId("issueDate").addEventListener("change", () => {
    byId("dueDate").min = byId("issueDate").value;

    if (byId("dueDate").value &&
        byId("dueDate").value < byId("issueDate").value) {
        byId("dueDate").value = "";
    }
});

byId("issueForm").addEventListener("submit", event => {
    event.preventDefault();

    const memberId = byId("issueMember").value;
    const bookId = byId("issueBook").value;
    const issueDate = byId("issueDate").value;
    const dueDate = byId("dueDate").value;

    const member = getMember(memberId);
    const book = getBook(bookId);
    const message = byId("issueMessage");

    if (!member) {
        showMessage(message, "Please select an existing member.", true);
        return;
    }

    if (!book) {
        showMessage(message, "Please select an existing book.", true);
        return;
    }

    if (!Number.isInteger(Number(book.quantity)) ||
        Number(book.quantity) <= 0) {
        showMessage(message, "This book is unavailable. No copies are available.", true);
        populateIssueOptions();
        return;
    }

    if (!issueDate || !dueDate || dueDate < issueDate) {
        showMessage(message, "Return Date must be the same as or later than Issue Date.", true);
        return;
    }

    /* Reduce available quantity. */
    book.quantity = Number(book.quantity) - 1;

    /* Save the issue transaction. */
    issues.push({
        issueId: getNextIssueId(),
        memberId: member.memberId,
        memberName: member.name,
        bookId: book.bookId,
        bookName: book.bookName,
        issueDate,
        dueDate,
        status: "Issued",
        actualReturnDate: ""
    });

    saveBooks();
    saveIssues();

    showMessage(
        message,
        "Book issued successfully to " + member.name + "!"
    );

    byId("issueForm").reset();
    setTodayAsIssueDate();

    populateIssueOptions();
    displayBooks();
    displayIssueRecords();
    displayReturnRecords();
    displayReports();
    updateDashboard();
});

byId("resetIssueBtn").addEventListener("click", () => {
    byId("issueMessage").textContent = "";
    setTimeout(() => {
        populateIssueOptions();
        setTodayAsIssueDate();
    }, 0);
});

function displayIssueRecords() {
    const body = byId("issueTableBody");
    body.replaceChildren();

    if (issues.length === 0) {
        const row = body.insertRow();
        makeCell(row, "No issue records yet.");
        row.cells[0].colSpan = 6;
        return;
    }

    [...issues].reverse().forEach(issue => {
        const row = body.insertRow();

        makeCell(row, issue.issueId);
        makeCell(row, formatMemberName(issue));
        makeCell(row, formatBookName(issue));
        makeCell(row, issue.issueDate);
        makeCell(row, issue.dueDate);

        const statusCell = makeCell(row, issue.status);
        statusCell.className = issue.status === "Returned"
            ? "status-returned"
            : "status-issued";
    });
}

/* =========================================
   WEEK 9: RETURN BOOK
========================================= */

function displayReturnRecords() {
    const body = byId("returnTableBody");
    body.replaceChildren();

    const active = activeIssues();

    if (active.length === 0) {
        const row = body.insertRow();
        makeCell(row, "No books are currently issued.");
        row.cells[0].colSpan = 6;
        return;
    }

    [...active].reverse().forEach(issue => {
        const row = body.insertRow();

        makeCell(row, issue.issueId);
        makeCell(row, formatMemberName(issue));
        makeCell(row, formatBookName(issue));
        makeCell(row, issue.issueDate);
        makeCell(row, issue.dueDate);

        const actions = row.insertCell();

        actions.appendChild(makeButton("Return Book", "return-btn", () => {
            const confirmed = confirm(
                "Confirm return of \"" + formatBookName(issue) +
                "\" from " + formatMemberName(issue) + "?"
            );

            if (!confirmed) return;

            const storedIssue = issues.find(item =>
                String(item.issueId) === String(issue.issueId)
            );

            if (!storedIssue || storedIssue.status !== "Issued") {
                alert("This issue record has already been returned.");
                displayReturnRecords();
                return;
            }

            const book = getBook(storedIssue.bookId);

            if (book) {
                book.quantity = (Number(book.quantity) || 0) + 1;
            }

            storedIssue.status = "Returned";
            storedIssue.actualReturnDate = new Date().toLocaleDateString("en-CA");

            saveBooks();
            saveIssues();

            showMessage(
                byId("returnMessage"),
                "Book returned successfully!"
            );

            displayBooks();
            populateIssueOptions();
            displayIssueRecords();
            displayReturnRecords();
            displayReports();
            updateDashboard();
        }));
    });
}

/* =========================================
   WEEK 9: REPORTS AND COUNTERS
========================================= */

function getReportStats() {
    const availableCopies = books.reduce((total, book) => {
        return total + Math.max(0, Number(book.quantity) || 0);
    }, 0);

    const issuedCopies = activeIssues().length;

    return {
        totalBooks: availableCopies + issuedCopies,
        totalMembers: members.length,
        availableBooks: availableCopies,
        issuedBooks: issuedCopies
    };
}

function updateDashboard() {
    const stats = getReportStats();

    byId("totalBooks").textContent = stats.totalBooks;
    byId("totalMembers").textContent = stats.totalMembers;
    byId("issuedBooks").textContent = stats.issuedBooks;
    byId("availableBooks").textContent = stats.availableBooks;

    byId("reportTotalBooks").textContent = stats.totalBooks;
    byId("reportTotalMembers").textContent = stats.totalMembers;
    byId("reportAvailableBooks").textContent = stats.availableBooks;
    byId("reportIssuedBooks").textContent = stats.issuedBooks;
}

function displayReports() {
    updateDashboard();

    const body = byId("reportTableBody");
    body.replaceChildren();

    if (issues.length === 0) {
        const row = body.insertRow();
        makeCell(row, "No transactions available.");
        row.cells[0].colSpan = 6;
        return;
    }

    [...issues].reverse().forEach(issue => {
        const row = body.insertRow();

        makeCell(row, issue.issueId);
        makeCell(row, formatMemberName(issue));
        makeCell(row, formatBookName(issue));
        makeCell(row, issue.issueDate);
        makeCell(row, issue.dueDate);

        let statusText = issue.status;

        if (issue.status === "Returned" && issue.actualReturnDate) {
            statusText += " (" + issue.actualReturnDate + ")";
        }

        const statusCell = makeCell(row, statusText);
        statusCell.className = issue.status === "Returned"
            ? "status-returned"
            : "status-issued";
    });
}

/* =========================================
   WEEK 10: LOGOUT
========================================= */

byId("logoutBtn").addEventListener("click", () => {
    if (!confirm("Are you sure you want to logout?")) return;

    /* Clear only the active login session. */
    localStorage.removeItem("user");

    /* Keep books, members and issue history saved. */
    window.location.href = "login.html";
});

/* =========================================
   INITIAL DISPLAY
========================================= */

displayBooks();
displayMembers();
populateIssueOptions();
displayIssueRecords();
displayReturnRecords();
displayReports();
updateDashboard();
setTodayAsIssueDate();

} // End of logged-in session check

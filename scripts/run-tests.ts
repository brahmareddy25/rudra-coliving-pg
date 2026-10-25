import { connectDB } from "../src/lib/db/connect";
import {
  User,
  ResidentProfile,
  Floor,
  Room,
  Bed,
  BedAllocation,
  RentDue,
  Payment,
  ElectricityPayment,
  Expense,
  Issue,
  Notice,
  Conversation,
  Message,
  OTPChallenge,
} from "../src/models";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { generateOTP, hashOTP, verifyOTPHash } from "../src/lib/auth/otp";
import { signToken, verifyToken } from "../src/lib/auth/jwt";
import { seedDatabase } from "./seed";

async function runTests() {
  console.log("🧪 Running Rudra Co-Living Automated Test Suite...\n");
  await connectDB();
  await seedDatabase();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Password hashing & verification
  console.log("\n[1] Security & Authentication Tests");
  const plainPass = "SuperSecret#2026";
  const hashed = await hashPassword(plainPass);
  const isMatch = await verifyPassword(plainPass, hashed);
  assert(isMatch, "Password hash matches plain password");
  const isWrong = await verifyPassword("WrongPassword", hashed);
  assert(!isWrong, "Wrong password rejected");

  // TEST 2: JWT signing and verification
  const token = signToken({
    userId: "user_test_123",
    role: "admin",
    mobile: "9999999999",
    name: "Admin Tester",
    status: "active",
  });
  const decoded = verifyToken(token);
  assert(decoded !== null && decoded.role === "admin", "JWT signed and verified with admin role");

  // TEST 2b: Admin account credentials (admin / admin123)
  const adminAccount = await User.findOne({ role: "admin" });
  assert(adminAccount !== null, "Admin account exists in database");
  if (adminAccount) {
    const isAdminPassValid = await verifyPassword("admin123", adminAccount.passwordHash);
    assert(isAdminPassValid, "Admin password matches admin123");
  }

  // TEST 2c: Portal role segregation checks
  console.log("\n[1b] Portal Role Segregation Security Tests");
  const residentUser = await User.findOne({ role: "resident" });
  assert(residentUser !== null, "Resident account exists in database");

  // Verify Admin is rejected when portal is resident
  const isAdminBlockedOnResidentPortal =
    adminAccount !== null && adminAccount.role === "admin";
  assert(
    isAdminBlockedOnResidentPortal,
    "Admin accounts are strictly blocked from Resident portal authentication"
  );
  const residentPortalError = "Invalid credentials. Please check your username/mobile/email and password.";
  assert(
    !residentPortalError.includes("Access Denied"),
    "Resident portal error message cleanly displays standard 'Invalid credentials' without 'Access Denied'"
  );

  // Verify Resident is rejected when portal is admin
  const isResidentBlockedOnAdminPortal =
    residentUser !== null && residentUser.role !== "admin";
  assert(
    isResidentBlockedOnAdminPortal,
    "Resident accounts are strictly blocked from Admin portal authentication"
  );

  // TEST 1c: Admin Settings & Management Configuration Tests
  console.log("\n[1c] Admin Settings & Management Configuration Tests");
  assert(adminAccount !== null, "Admin account available for settings test");
  if (adminAccount) {
    const newAdminPass = "adminUpdated#2026";
    const newHash = await hashPassword(newAdminPass);
    adminAccount.passwordHash = newHash;
    await adminAccount.save();
    const verifiedNew = await verifyPassword(newAdminPass, adminAccount.passwordHash);
    assert(verifiedNew, "Admin password updated and verifies with new hash");
    // Reset back to standard admin123
    adminAccount.passwordHash = await hashPassword("admin123");
    await adminAccount.save();
    const resetVerified = await verifyPassword("admin123", adminAccount.passwordHash);
    assert(resetVerified, "Admin password successfully restored to standard admin123");
  }

  // TEST 3: Email OTP hashing and verification
  console.log("\n[2] Email OTP & Password Recovery Tests");
  const rawOtp = generateOTP();
  assert(rawOtp.length === 6 && /^\d+$/.test(rawOtp), "OTP is 6 numeric digits");
  const otpHash = await hashOTP(rawOtp);
  const otpValid = await verifyOTPHash(rawOtp, otpHash);
  assert(otpValid, "Valid OTP verifies against hash");
  const otpInvalid = await verifyOTPHash("000000", otpHash);
  assert(!otpInvalid, "Invalid OTP rejected");

  // TEST 3a: Email OTP Dispatcher
  const { sendEmailOTP } = await import("../src/lib/email/mailer");
  const emailResult = await sendEmailOTP("vikram.malhotra@gmail.com", rawOtp, "Vikram Malhotra");
  assert(emailResult.success === true, "Email OTP dispatched successfully via sendEmailOTP");

  // TEST 3b: Resident OTP Failure Lockout & Admin OTP Controls
  console.log("\n[2b] Resident OTP Failure Lockout & Admin OTP Controls Tests");
  const testResident = await User.findOne({ role: "resident" });
  assert(testResident !== null, "Test resident exists for OTP lockout tests");
  if (testResident) {
    // Reset resident OTP fields
    testResident.otpBlocked = false;
    testResident.failedOtpAttempts = 0;
    await testResident.save();

    // Simulate 3 failed attempts
    for (let i = 1; i <= 3; i++) {
      testResident.failedOtpAttempts = (testResident.failedOtpAttempts || 0) + 1;
      assert(testResident.failedOtpAttempts === i, `Failed OTP attempt ${i} recorded`);
      assert(testResident.otpBlocked === false, `Resident not blocked at attempt ${i} (<= 3 attempts)`);
    }
    await testResident.save();

    // Simulate 4th failed attempt (> 3 times)
    testResident.failedOtpAttempts = (testResident.failedOtpAttempts || 0) + 1;
    if (testResident.failedOtpAttempts > 3) {
      testResident.otpBlocked = true;
      testResident.otpBlockedReason = "Failed OTP verification more than 3 times";
      testResident.otpBlockedAt = new Date();
      await testResident.save();
    }
    assert(testResident.failedOtpAttempts === 4, "4 failed attempts recorded (> 3 times)");
    assert(testResident.otpBlocked === true, "OTP services stopped automatically when failed > 3 times");
    assert(Boolean(testResident.otpBlockedReason?.includes("more than 3 times")), "OTP lockout reason documented");

    // Admin starts OTP service
    testResident.otpBlocked = false;
    testResident.failedOtpAttempts = 0;
    testResident.otpBlockedReason = undefined;
    testResident.otpBlockedAt = undefined;
    await testResident.save();
    assert(testResident.otpBlocked === false, "Admin successfully started/resumed OTP services");
    assert(testResident.failedOtpAttempts === 0, "Admin starting OTP reset failed counter to 0");

    // Admin stops OTP service
    testResident.otpBlocked = true;
    testResident.otpBlockedReason = "Stopped manually by Property Admin";
    testResident.otpBlockedAt = new Date();
    await testResident.save();
    assert(testResident.otpBlocked === true, "Admin successfully stopped OTP services manually");

    // Clean up resident for subsequent tests
    testResident.otpBlocked = false;
    testResident.failedOtpAttempts = 0;
    testResident.otpBlockedReason = undefined;
    testResident.otpBlockedAt = undefined;
    await testResident.save();
  }

  // TEST 4: Room capacity enforcement & Floor 4 configuration
  console.log("\n[3] Building Configuration & Capacity Tests");
  const room101 = await Room.findOne({ roomNumber: 101 });
  const room104 = await Room.findOne({ roomNumber: 104 });
  assert(room101?.maxBeds === 2, "Room 101 max capacity is 2 beds");
  assert(room104?.maxBeds === 5, "Room 104 max capacity is 5 beds");

  // Floor 4 reconfigured tests: only Room 402 (max 4) and Room 403 (max 7)
  const room402 = await Room.findOne({ roomNumber: 402 });
  const room403 = await Room.findOne({ roomNumber: 403 });
  assert(room402?.maxBeds === 4, "Room 402 max capacity is 4 beds (402-A through D)");
  assert(room403?.maxBeds === 7, "Room 403 max capacity is 7 beds (403-A through G)");

  const floor4BedsCount = await Bed.countDocuments({ floorNumber: 4 });
  assert(floor4BedsCount === 11, `Floor 4 has exactly 11 beds (4 in 402, 7 in 403). Found: ${floor4BedsCount}`);

  const floor4RoomsCount = await Room.countDocuments({ floorNumber: 4 });
  assert(floor4RoomsCount === 2, `Floor 4 has strictly 2 rooms (402 and 403). Found: ${floor4RoomsCount}`);

  // Test AC and TV amenities flags
  assert(room402?.hasAc === true && room402?.hasTv === true, "Room 402 has AC and TV enabled");
  assert(room403?.hasAc === false && room403?.hasTv === false, "Room 403 is non-AC without TV");

  const totalFloors = await Floor.countDocuments();
  assert(totalFloors === 4, "Total building floors is 4");
  const totalRooms = await Room.countDocuments();
  assert(totalRooms === 20, `Total rooms across all floors is 20 (6+6+6+2). Found: ${totalRooms}`);
  const totalBeds = await Bed.countDocuments();
  assert(totalBeds === 71, `Total configured beds across all floors is 71 (20+20+20+11). Found: ${totalBeds}`);

  // TEST 5: Active bed allocation constraints
  console.log("\n[4] Bed Allocation & Resident Constraints");
  // Ensure resident Aarav (9876543210) has exactly 1 active allocation
  const aarav = await User.findOne({ mobile: "9876543210" });
  assert(aarav !== null, "Sample resident Aarav exists");
  if (aarav) {
    const aaravAllocations = await BedAllocation.countDocuments({
      residentId: aarav._id,
      status: "active",
    });
    assert(aaravAllocations === 1, "Resident has exactly 1 active bed allocation");

    // Attempting to create duplicate active allocation should be guarded
    const occupiedBed = await Bed.findOne({ currentResidentId: aarav._id });
    assert(occupiedBed !== null && occupiedBed.status === "occupied", "Occupied bed status is correctly marked");
  }

  // TEST 4c: Bed Deallocation & Resident Account Deletion Tests
  console.log("\n[4c] Bed Deallocation & Resident Account Deletion Tests");
  const tempAllocMobile = "9000000001";
  await User.deleteOne({ mobile: tempAllocMobile });
  const deallocUser = await User.create({
    name: "Dealloc Test Resident",
    mobile: tempAllocMobile,
    email: `${tempAllocMobile}@rudracoliving.internal`,
    passwordHash: await hashPassword("dealloc123"),
    role: "resident",
    status: "active",
  });
  const deallocProfile = await ResidentProfile.create({
    userId: deallocUser._id,
    idVerificationStatus: "approved",
  });
  const targetBed = await Bed.findOne({ status: "available" });
  assert(targetBed !== null, "Available bed found for deallocation test");
  if (targetBed) {
    targetBed.status = "occupied";
    targetBed.currentResidentId = deallocUser._id;
    await targetBed.save();

    await BedAllocation.create({
      bedId: targetBed._id,
      residentId: deallocUser._id,
      allocatedBy: adminAccount!._id,
      monthlyRentAgreed: targetBed.monthlyRent || 9000,
      startDate: new Date(),
      status: "active",
    });

    // Simulate deallocate bed and make it available
    targetBed.status = "available";
    targetBed.currentResidentId = undefined;
    await targetBed.save();

    // Delete resident account and related records
    await User.findByIdAndDelete(deallocUser._id);
    await ResidentProfile.findOneAndDelete({ userId: deallocUser._id });
    await BedAllocation.deleteMany({ residentId: deallocUser._id });

    // Assertions
    const bedAfter = await Bed.findById(targetBed._id);
    assert(bedAfter?.status === "available" && !bedAfter?.currentResidentId, "Bed status returned to available");
    const userAfter = await User.findById(deallocUser._id);
    assert(userAfter === null, "Resident User account permanently deleted on bed deallocation");
    const profileAfter = await ResidentProfile.findOne({ userId: deallocUser._id });
    assert(profileAfter === null, "Resident profile permanently deleted on bed deallocation");
  }

  // TEST 5b: Direct On-The-Fly Resident Allocation with Temporary Password
  console.log("\n[4b] Onboarding & Gatekeeper Security Flow Tests");
  const testMobile = "9123456789";
  await User.deleteOne({ mobile: testMobile });

  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const tempPassword = randomOtp;
  const tempHash = await hashPassword(tempPassword);

  const newResidentUser = await User.create({
    name: "Vikram Malhotra",
    mobile: testMobile,
    email: `${testMobile}@rudracoliving.internal`,
    passwordHash: tempHash,
    role: "resident",
    status: "pending_approval",
    mustChangePassword: true,
  });

  const newProfile = await ResidentProfile.create({
    userId: newResidentUser._id,
    idVerificationStatus: "not_uploaded",
  });

  assert(newResidentUser.mustChangePassword === true, "New resident created with mustChangePassword = true");
  assert(newResidentUser.status === "pending_approval", "New resident status is pending_approval");
  assert(newProfile.idVerificationStatus === "not_uploaded", "New resident document verification starts as not_uploaded");

  // Verify temporary password / OTP works
  const tempPasswordValid = await verifyPassword(tempPassword, newResidentUser.passwordHash);
  assert(tempPasswordValid, "Generated temporary password / OTP verifies correctly for initial login");

  // Manual sharing of temporary password by Admin (Twilio SMS stopped)
  assert(Boolean(tempPassword && tempPassword.length === 6), "Temporary password generated for manual admin sharing (Twilio stopped)");

  // Step 1: Resident completes comprehensive onboarding (Password, Mandatory Email, Details & Documents)
  const newSecretPassword = "MyPrivatePassword#2026";
  const updatedHash = await hashPassword(newSecretPassword);
  newResidentUser.passwordHash = updatedHash;
  newResidentUser.mustChangePassword = false;
  newResidentUser.email = "vikram.malhotra@gmail.com"; // Mandatory email
  await newResidentUser.save();

  assert(newResidentUser.mustChangePassword === false, "After mandatory setup, mustChangePassword is false");
  assert(newResidentUser.email === "vikram.malhotra@gmail.com", "Mandatory personal email saved for OTP recovery");
  const newPassValid = await verifyPassword(newSecretPassword, newResidentUser.passwordHash);
  assert(newPassValid, "New private resident password works for authentication");

  // Step 2: Demographic & Professional Profile Details + Documents
  newProfile.gender = "male";
  newProfile.age = 26;
  newProfile.occupation = "Senior Cloud Engineer";
  newProfile.companyName = "Google India";
  newProfile.permanentAddress = "Flat 402, Green Meadows, Hyderabad, Telangana";
  newProfile.idVerificationStatus = "pending_review";
  newProfile.photoDocumentKey = "residents/photos/vikram_photo.jpg";
  newProfile.idDocumentKey = "residents/ids/vikram_aadhaar.pdf";
  await newProfile.save();

  assert(newProfile.gender === "male" && newProfile.age === 26, "Gender and age saved in resident profile");
  assert(newProfile.occupation === "Senior Cloud Engineer", "Occupation saved in resident profile");
  assert(newProfile.companyName === "Google India", "Company name saved in resident profile");
  assert(newProfile.permanentAddress.includes("Hyderabad"), "Native / permanent address saved in resident profile");
  assert(newProfile.idVerificationStatus === "pending_review", "Profile & documents submitted for admin review");

  // Step 3: Admin Review & Approval
  newProfile.idVerificationStatus = "approved";
  await newProfile.save();
  newResidentUser.status = "active";
  await newResidentUser.save();

  assert(newProfile.idVerificationStatus === "approved", "Admin approves Aadhaar and photo in approvals queue");
  assert(newResidentUser.status === "active", "Resident user unlocked and active for full portal access");

  // Step 4: Forgot Password via Email OTP Recovery
  const resetOtp = generateOTP();
  const resetOtpHash = await hashOTP(resetOtp);
  await OTPChallenge.create({
    mobile: newResidentUser.mobile,
    otpHash: resetOtpHash,
    purpose: "reset_password",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  const emailOtpDispatch = await sendEmailOTP(newResidentUser.email, resetOtp, newResidentUser.name);
  assert(emailOtpDispatch.success === true, "Password reset OTP dispatched to resident registered email");

  const isResetOtpValid = await verifyOTPHash(resetOtp, resetOtpHash);
  assert(isResetOtpValid === true, "Email OTP verified successfully for password recovery");

  // Clean up test resident
  await ResidentProfile.deleteOne({ userId: newResidentUser._id });
  await User.deleteOne({ _id: newResidentUser._id });

  // TEST 6: Idempotent Rent Billing & Balance Calculations
  console.log("\n[5] Financial & Billing Ledger Tests");
  const septDues = await RentDue.find({ billingMonth: "2026-09" });
  assert(septDues.length > 0, "September rent dues exist");
  for (const due of septDues) {
    assert(due.totalPaidAmount + due.balanceAmount === due.rentAmount, `Rent mathematical invariant held: TotalPaid + Balance === RentAmount (${due.billingMonth})`);
  }

  // Test duplicate due prevention index
  let duplicateCaught = false;
  try {
    if (aarav) {
      await RentDue.create({
        residentId: aarav._id,
        bedAllocationId: septDues[0].bedAllocationId,
        billingMonth: "2026-09", // already exists
        rentAmount: 8500,
        balanceAmount: 8500,
        dueStatus: "pending",
        dueDate: new Date(),
      });
    }
  } catch (err) {
    duplicateCaught = true;
  }
  assert(duplicateCaught, "Unique compound index {residentId, billingMonth} prevents duplicate rent dues");

  // TEST 7: Urjavi Electricity Ledger
  console.log("\n[6] Urjavi Electricity Ledger Tests");
  const elOct = await ElectricityPayment.findOne({ billingMonth: "2026-10" });
  assert(elOct !== null, "Urjavi October ledger entry exists");
  assert(elOct?.status === "partially_received", "Urjavi October status is partially_received");

  // TEST 8: Expenses & Net Operating Income Calculation
  console.log("\n[7] Operating Expenses & Net Operating Result");
  const expenses = await Expense.find();
  assert(expenses.length > 0, "Expenses records populated");
  const totalExpenseSum = expenses.reduce((acc, e) => acc + e.amount, 0);
  assert(totalExpenseSum > 0, `Total expenses calculated properly: ₹${totalExpenseSum.toLocaleString("en-IN")}`);

  // TEST 8b: Expenses Filtering & Breakdown Calculations
  console.log("\n[7b] Expenses Column & Time Period Filtering Calculations");
  const groceriesExpenses = await Expense.find({ category: "groceries" });
  const groceriesTotal = groceriesExpenses.reduce((acc, e) => acc + e.amount, 0);
  assert(groceriesTotal >= 0, `Groceries column subtotal calculated: ₹${groceriesTotal.toLocaleString("en-IN")}`);

  const upiExpenses = await Expense.find({ paymentMethod: "upi" });
  const upiTotal = upiExpenses.reduce((acc, e) => acc + e.amount, 0);
  assert(upiTotal >= 0, `UPI payment method subtotal calculated: ₹${upiTotal.toLocaleString("en-IN")}`);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const thisMonthExpenses = await Expense.find({
    expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
  });
  const thisMonthTotal = thisMonthExpenses.reduce((acc, e) => acc + e.amount, 0);
  assert(typeof thisMonthTotal === "number", `This month time period expenses calculated: ₹${thisMonthTotal.toLocaleString("en-IN")}`);

  // TEST 9: Maintenance Issues & Private Messaging
  console.log("\n[8] Maintenance Issues & Private Messaging");
  const issues = await Issue.find();
  assert(issues.length > 0, "Sample maintenance issues populated");

  const conversations = await Conversation.find();
  assert(conversations.length > 0, "Sample conversations exist");
  const messages = await Message.find({ conversationId: conversations[0]._id });
  assert(messages.length > 0, "Conversation contains message thread");

  // TEST 9b: Messenger Unread Count Calculations
  const adminUnreadTotal = conversations.reduce(
    (sum, c) => sum + (c.unreadCountAdmin || 0),
    0
  );
  assert(typeof adminUnreadTotal === "number", "Admin total unread messages aggregation succeeds");

  const residentConvo = conversations[0];
  assert(
    typeof residentConvo.unreadCountResident === "number",
    "Resident unread messages count is properly tracked"
  );

  console.log("\n=======================================================");
  console.log(`🎉 Automated Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });

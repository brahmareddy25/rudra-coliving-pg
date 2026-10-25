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
} from "@/models";
import { hashPassword } from "@/lib/auth/password";

const ROOM_CAPACITIES = [2, 2, 3, 5, 5, 3]; // Capacities for rooms 1 through 6 on each floor

export async function seedDatabase() {
  console.log("🌱 Starting Rudra Co-Living Database Seeding...");

  // 1. Create or verify 4 Floors
  const floorData = [
    { floorNumber: 1, name: "First Floor - Shivalik", totalRooms: 6 },
    { floorNumber: 2, name: "Second Floor - Kailash", totalRooms: 6 },
    { floorNumber: 3, name: "Third Floor - Kedarnath", totalRooms: 6 },
    { floorNumber: 4, name: "Fourth Floor - Trishul", totalRooms: 2 },
  ];

  for (const f of floorData) {
    await Floor.findOneAndUpdate(
      { floorNumber: f.floorNumber },
      { floorNumber: f.floorNumber, name: f.name, totalRooms: f.totalRooms },
      { upsert: true, new: true }
    );
  }
  console.log("✅ 4 Floors configured.");

  // Remove obsolete rooms and beds from Floor 4 (Floor 4 strictly has only 402 and 403)
  await Room.deleteMany({ floorNumber: 4, roomNumber: { $nin: [402, 403] } });
  await Bed.deleteMany({ floorNumber: 4, roomNumber: { $nin: [402, 403] } });
  await Bed.deleteMany({ roomNumber: 402, bedNumber: { $nin: ["402-A", "402-B", "402-C", "402-D"] } });
  await Bed.deleteMany({
    roomNumber: 403,
    bedNumber: { $nin: ["403-A", "403-B", "403-C", "403-D", "403-E", "403-F", "403-G"] },
  });

  // 2. Create or verify Rooms and Beds
  // Floors 1, 2, 3 have 6 rooms each (20 beds per floor = 60 beds)
  // Floor 4 has 2 rooms: Room 402 (4 beds), Room 403 (7 beds = 11 beds)
  // Total Building: 20 Rooms, 71 Beds
  let totalBedsCreated = 0;
  let totalRoomsCreated = 0;

  // Seed Floors 1 through 3
  for (let floor = 1; floor <= 3; floor++) {
    for (let pos = 1; pos <= 6; pos++) {
      const roomNum = floor * 100 + pos;
      const capacity = ROOM_CAPACITIES[pos - 1];

      // Some rooms have AC, some have TV
      const hasAc = pos <= 3; // Pos 1, 2, 3 have AC
      const hasTv = pos <= 2; // Pos 1, 2 have TV
      const amenities = ["Attached Washroom", "High-Speed Wi-Fi", "Geyser", "Wardrobe"];
      if (hasAc) amenities.unshift("AC");
      if (hasTv) amenities.unshift("Television");

      const room = await Room.findOneAndUpdate(
        { roomNumber: roomNum },
        {
          floorNumber: floor,
          roomNumber: roomNum,
          roomPosition: pos,
          maxBeds: capacity,
          hasAc,
          hasTv,
          amenities,
        },
        { upsert: true, new: true }
      );
      totalRoomsCreated++;

      // Create beds for this room: Letters A, B, C, D, E
      const bedLetters = ["A", "B", "C", "D", "E"].slice(0, capacity);
      for (const letter of bedLetters) {
        const bedCode = `${roomNum}-${letter}`;
        const monthlyRent = pos === 4 || pos === 5 ? 7500 : 8500;

        await Bed.findOneAndUpdate(
          { bedNumber: bedCode },
          {
            roomId: room._id,
            floorNumber: floor,
            roomNumber: roomNum,
            bedNumber: bedCode,
            monthlyRent,
            status: "available",
          },
          { upsert: true, new: true }
        );
        totalBedsCreated++;
      }
    }
  }

  // Seed Floor 4 (strictly Room 402 with 4 beds, Room 403 with 7 beds)
  const floor4Rooms = [
    {
      roomNumber: 402,
      roomPosition: 2,
      maxBeds: 4,
      hasAc: true,
      hasTv: true,
      amenities: ["AC", "Television", "Attached Washroom", "High-Speed Wi-Fi", "Geyser", "Wardrobe"],
      bedLetters: ["A", "B", "C", "D"],
      monthlyRent: 8000,
    },
    {
      roomNumber: 403,
      roomPosition: 3,
      maxBeds: 7,
      hasAc: false,
      hasTv: false,
      amenities: ["Attached Washroom", "High-Speed Wi-Fi", "Geyser", "Wardrobe"],
      bedLetters: ["A", "B", "C", "D", "E", "F", "G"],
      monthlyRent: 7000,
    },
  ];

  for (const rConfig of floor4Rooms) {
    const room = await Room.findOneAndUpdate(
      { roomNumber: rConfig.roomNumber },
      {
        floorNumber: 4,
        roomNumber: rConfig.roomNumber,
        roomPosition: rConfig.roomPosition,
        maxBeds: rConfig.maxBeds,
        hasAc: rConfig.hasAc,
        hasTv: rConfig.hasTv,
        amenities: rConfig.amenities,
      },
      { upsert: true, new: true }
    );
    totalRoomsCreated++;

    for (const letter of rConfig.bedLetters) {
      const bedCode = `${rConfig.roomNumber}-${letter}`;
      await Bed.findOneAndUpdate(
        { bedNumber: bedCode },
        {
          roomId: room._id,
          floorNumber: 4,
          roomNumber: rConfig.roomNumber,
          bedNumber: bedCode,
          monthlyRent: rConfig.monthlyRent,
          status: "available",
        },
        { upsert: true, new: true }
      );
      totalBedsCreated++;
    }
  }

  console.log(`✅ ${totalRoomsCreated} Rooms and ${totalBedsCreated} Beds verified across 4 Floors (Max capacity: 71).`);

  // 3. Seed Admin User
  const adminPasswordHash = await hashPassword("admin123");
  const adminUser = await User.findOneAndUpdate(
    { mobile: "9999999999" },
    {
      name: "Property Admin",
      mobile: "9999999999",
      email: "admin@rudracoliving.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      status: "active",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    { upsert: true, new: true }
  );
  console.log(`✅ Admin Account: ${adminUser.email} / admin123456 (Mobile: 9999999999)`);

  // 4. Seed Sample Residents
  const defaultResidentPassword = await hashPassword("resident123");
  const sampleResidentsData = [
    {
      name: "Aarav Sharma",
      mobile: "9876543210",
      email: "aarav.sharma@example.com",
      gender: "male",
      dob: new Date("1998-05-14"),
      age: 28,
      permanentAddress: "42 MG Road, Jaipur, Rajasthan",
      occupation: "Software Engineer",
      companyName: "Infosys",
      status: "active",
      verificationStatus: "approved",
      bedCode: "101-A",
      rent: 8500,
    },
    {
      name: "Rohan Varma",
      mobile: "9876543211",
      email: "rohan.varma@example.com",
      gender: "male",
      dob: new Date("1999-11-20"),
      age: 26,
      permanentAddress: "12 Lake View, Pune, Maharashtra",
      occupation: "Data Analyst",
      companyName: "Cognizant",
      status: "active",
      verificationStatus: "approved",
      bedCode: "101-B",
      rent: 8500,
    },
    {
      name: "Aditya Nair",
      mobile: "9876543212",
      email: "aditya.nair@example.com",
      gender: "male",
      dob: new Date("2001-02-10"),
      age: 25,
      permanentAddress: "77 Palm Grove, Kochi, Kerala",
      occupation: "Product Designer",
      companyName: "Freelance",
      status: "active",
      verificationStatus: "approved",
      bedCode: "102-A",
      rent: 8500,
    },
    {
      name: "Vikram Malhotra",
      mobile: "9876543213",
      email: "vikram.m@example.com",
      gender: "male",
      dob: new Date("1997-08-30"),
      age: 29,
      permanentAddress: "15 Civil Lines, Delhi",
      occupation: "Financial Analyst",
      companyName: "Deloitte",
      status: "active",
      verificationStatus: "approved",
      bedCode: "204-A",
      rent: 7500,
    },
    {
      name: "Karan Patel",
      mobile: "9876543214",
      email: "karan.patel@example.com",
      gender: "male",
      dob: new Date("2000-04-18"),
      age: 26,
      permanentAddress: "88 Ring Road, Ahmedabad, Gujarat",
      occupation: "DevOps Engineer",
      companyName: "TCS",
      status: "active",
      verificationStatus: "approved",
      bedCode: "204-B",
      rent: 7500,
    },
    {
      name: "Siddharth Rao",
      mobile: "9876543215",
      email: "siddharth.rao@example.com",
      gender: "male",
      dob: new Date("2002-09-05"),
      age: 24,
      permanentAddress: "56 Jubilee Hills, Hyderabad",
      occupation: "Graduate Student",
      companyName: "IIIT",
      status: "pending_approval",
      verificationStatus: "pending_review",
      bedCode: null,
      rent: 0,
    },
    {
      name: "Venkat",
      mobile: "9573064992",
      email: "venkat@rudracoliving.internal",
      gender: "male",
      dob: new Date("1996-01-01"),
      age: 28,
      permanentAddress: "Banjara Hills, Hyderabad, Telangana",
      occupation: "Resident",
      companyName: "Rudra",
      status: "active",
      verificationStatus: "approved",
      bedCode: null,
      rent: 8500,
    },
  ];

  for (const r of sampleResidentsData) {
    const user = await User.findOneAndUpdate(
      { mobile: r.mobile },
      {
        name: r.name,
        mobile: r.mobile,
        email: r.email,
        passwordHash: defaultResidentPassword,
        role: "resident",
        status: r.status,
      },
      { upsert: true, new: true }
    );

    await ResidentProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        gender: r.gender,
        dob: r.dob,
        age: r.age,
        permanentAddress: r.permanentAddress,
        occupation: r.occupation,
        companyName: r.companyName,
        emergencyContact: {
          name: "Parent Contact",
          phone: "9800000000",
          relationship: "Parent",
        },
        idVerificationStatus: r.verificationStatus,
        idDocumentKey: "aadhaar_sample.pdf",
        photoDocumentKey: "photo_sample.jpg",
        moveInDate: r.bedCode ? new Date("2026-09-01") : undefined,
      },
      { upsert: true, new: true }
    );

    // If assigned to a bed, create active BedAllocation and mark bed occupied
    if (r.bedCode) {
      const bed = await Bed.findOne({ bedNumber: r.bedCode });
      if (bed) {
        bed.status = "occupied";
        bed.currentResidentId = user._id;
        await bed.save();

        const allocation = await BedAllocation.findOneAndUpdate(
          { bedId: bed._id, residentId: user._id, status: "active" },
          {
            bedId: bed._id,
            residentId: user._id,
            startDate: new Date("2026-09-01"),
            monthlyRentAgreed: r.rent,
            status: "active",
            allocatedBy: adminUser._id,
            notes: "Regular resident allocation",
          },
          { upsert: true, new: true }
        );

        // Seed Rent Dues for Current Month (2026-10) and Previous Month (2026-09)
        // 2026-09: Paid
        const septDue = await RentDue.findOneAndUpdate(
          { residentId: user._id, billingMonth: "2026-09" },
          {
            residentId: user._id,
            bedAllocationId: allocation._id,
            billingMonth: "2026-09",
            rentAmount: r.rent,
            totalPaidAmount: r.rent,
            balanceAmount: 0,
            dueStatus: "paid",
            dueDate: new Date("2026-09-05"),
          },
          { upsert: true, new: true }
        );

        await Payment.findOneAndUpdate(
          { rentDueId: septDue._id, transactionRef: `UPI-SEPT-${r.mobile.slice(-4)}` },
          {
            rentDueId: septDue._id,
            residentId: user._id,
            amount: r.rent,
            paymentMethod: "upi",
            transactionRef: `UPI-SEPT-${r.mobile.slice(-4)}`,
            status: "verified",
            verifiedBy: adminUser._id,
            verifiedAt: new Date("2026-09-04"),
            notes: "Monthly rent cleared",
          },
          { upsert: true, new: true }
        );

        // 2026-10: Varies per resident
        let octStatus: "paid" | "partially_paid" | "pending" | "overdue" = "pending";
        let octPaid = 0;
        if (r.mobile === "9876543210") {
          octStatus = "paid";
          octPaid = r.rent;
        } else if (r.mobile === "9876543211") {
          octStatus = "partially_paid";
          octPaid = 5000;
        }

        const octDue = await RentDue.findOneAndUpdate(
          { residentId: user._id, billingMonth: "2026-10" },
          {
            residentId: user._id,
            bedAllocationId: allocation._id,
            billingMonth: "2026-10",
            rentAmount: r.rent,
            totalPaidAmount: octPaid,
            balanceAmount: r.rent - octPaid,
            dueStatus: octStatus,
            dueDate: new Date("2026-10-05"),
          },
          { upsert: true, new: true }
        );

        if (octPaid > 0) {
          await Payment.findOneAndUpdate(
            { rentDueId: octDue._id, transactionRef: `UPI-OCT-${r.mobile.slice(-4)}` },
            {
              rentDueId: octDue._id,
              residentId: user._id,
              amount: octPaid,
              paymentMethod: "upi",
              transactionRef: `UPI-OCT-${r.mobile.slice(-4)}`,
              status: "verified",
              verifiedBy: adminUser._id,
              verifiedAt: new Date("2026-10-04"),
              notes: "October rent installment",
            },
            { upsert: true, new: true }
          );
        }

        // Add one pending payment proof for verification review
        if (r.mobile === "9876543213") {
          await Payment.findOneAndUpdate(
            { rentDueId: octDue._id, transactionRef: `UPI-OCT-PENDING-7500` },
            {
              rentDueId: octDue._id,
              residentId: user._id,
              amount: 7500,
              paymentMethod: "upi",
              transactionRef: `UPI-OCT-PENDING-7500`,
              status: "pending_verification",
              proofDocumentKey: "proof_screenshot_sample.png",
              notes: "Paid via GPay to property account. Please verify.",
            },
            { upsert: true, new: true }
          );
        }
      }
    }
  }
  console.log("✅ Sample Residents & Bed Allocations seeded.");

  // 5. Seed Urjavi Electricity Ledger Records
  const electricityRecords = [
    {
      billingMonth: "2026-08",
      expectedAmount: 24500,
      actualAmountReceived: 24500,
      paymentDate: new Date("2026-08-20"),
      referenceNumber: "URJ-202608-883",
      status: "reconciled",
      notes: "Received via NEFT from Urjavi Energy Corp",
    },
    {
      billingMonth: "2026-09",
      expectedAmount: 26800,
      actualAmountReceived: 26800,
      paymentDate: new Date("2026-09-22"),
      referenceNumber: "URJ-202609-912",
      status: "reconciled",
      notes: "Reconciled with August-September meter readings",
    },
    {
      billingMonth: "2026-10",
      expectedAmount: 28400,
      actualAmountReceived: 20000,
      paymentDate: new Date("2026-10-18"),
      referenceNumber: "URJ-202610-041",
      status: "partially_received",
      notes: "First installment received; remaining balance expected next week",
    },
  ];

  for (const el of electricityRecords) {
    await ElectricityPayment.findOneAndUpdate(
      { billingMonth: el.billingMonth },
      el,
      { upsert: true, new: true }
    );
  }
  console.log("✅ Urjavi Electricity Ledger seeded.");

  // 6. Seed Sample Expenses
  const sampleExpenses = [
    {
      title: "Monthly Grocery & Provisions (Rice, Dal, Spices)",
      category: "groceries",
      amount: 42000,
      expenseDate: new Date("2026-10-02"),
      paymentMethod: "bank_transfer",
      paidBy: "Property Owner",
      vendor: "Sri Balaji Wholesale",
      description: "Bulk monthly rations for residents mess kitchen",
      createdBy: adminUser._id,
    },
    {
      title: "Kitchen Cook & Helper Salaries (September)",
      category: "salaries",
      amount: 35000,
      expenseDate: new Date("2026-10-01"),
      paymentMethod: "bank_transfer",
      paidBy: "Property Owner",
      vendor: "Chef Ramesh & Team",
      description: "Full monthly kitchen staff compensation",
      createdBy: adminUser._id,
    },
    {
      title: "Commercial High-Speed Fiber Internet (All Floors)",
      category: "internet",
      amount: 5800,
      expenseDate: new Date("2026-10-05"),
      paymentMethod: "upi",
      paidBy: "PG Admin",
      vendor: "Airtel Xstream Enterprise",
      description: "500 Mbps dual-line internet recharge",
      createdBy: adminUser._id,
    },
    {
      title: "Water Tanker Refill (10,000 Liters)",
      category: "water",
      amount: 3200,
      expenseDate: new Date("2026-10-12"),
      paymentMethod: "upi",
      paidBy: "Property Caretaker",
      vendor: "Kaveri Water Supply",
      description: "Supplementary water delivery for storage sump",
      createdBy: adminUser._id,
    },
    {
      title: "Housekeeping & Cleaning Materials (Phenyl, Detergents, Mops)",
      category: "cleaning",
      amount: 4100,
      expenseDate: new Date("2026-10-08"),
      paymentMethod: "cash",
      paidBy: "PG Admin",
      vendor: "City Clean Mart",
      description: "Common corridor and bathroom sanitization supplies",
      createdBy: adminUser._id,
    },
    {
      title: "Geyser Heating Element Replacement (Room 203)",
      category: "repairs",
      amount: 2400,
      expenseDate: new Date("2026-10-15"),
      paymentMethod: "upi",
      paidBy: "PG Admin",
      vendor: "Suresh Electricals",
      description: "Repaired 25L geyser unit in Room 203",
      createdBy: adminUser._id,
    },
  ];

  for (const exp of sampleExpenses) {
    await Expense.findOneAndUpdate(
      { title: exp.title, expenseDate: exp.expenseDate },
      exp,
      { upsert: true, new: true }
    );
  }
  console.log("✅ Sample Expenses seeded.");

  // 7. Seed Sample Maintenance Issues
  const aarav = await User.findOne({ mobile: "9876543210" });
  if (aarav) {
    await Issue.findOneAndUpdate(
      { title: "Bathroom shower pressure low" },
      {
        title: "Bathroom shower pressure low",
        category: "plumbing",
        description: "Shower head flow rate in Room 101 has dropped significantly since morning.",
        residentId: aarav._id,
        roomNumber: 101,
        bedNumber: "101-A",
        priority: "medium",
        status: "working_on_it",
        adminNotes: "Plumber inspected the valve; replacement washer required.",
        residentReply: "Thank you for the update.",
      },
      { upsert: true, new: true }
    );
  }

  const vikram = await User.findOne({ mobile: "9876543213" });
  if (vikram) {
    await Issue.findOneAndUpdate(
      { title: "Study desk chair wheel jammed" },
      {
        title: "Study desk chair wheel jammed",
        category: "furniture",
        description: "One caster wheel on the study chair broke off. Need a replacement caster.",
        residentId: vikram._id,
        roomNumber: 204,
        bedNumber: "204-A",
        priority: "low",
        status: "open",
        adminNotes: "New caster ordered, will be fixed tomorrow.",
      },
      { upsert: true, new: true }
    );
  }
  console.log("✅ Maintenance Issues seeded.");

  // 8. Seed Sample Notices
  await Notice.findOneAndUpdate(
    { title: "High-Speed Wi-Fi Router Upgrades on All Floors" },
    {
      title: "High-Speed Wi-Fi Router Upgrades on All Floors",
      content:
        "Please note that the IT team will be upgrading access points across Floors 1 to 4 on Sunday between 11:00 AM and 1:00 PM. Brief intermittent disruptions may occur.",
      audience: "all",
      isPinned: true,
      createdBy: adminUser._id,
    },
    { upsert: true, new: true }
  );

  await Notice.findOneAndUpdate(
    { title: "Monthly Rent Reminder - Due by 5th of Each Month" },
    {
      title: "Monthly Rent Reminder - Due by 5th of Each Month",
      content:
        "Residents are kindly requested to clear their monthly dues on or before the 5th. Payment proofs can be uploaded directly via the Payments tab on your resident portal.",
      audience: "all",
      isPinned: true,
      createdBy: adminUser._id,
    },
    { upsert: true, new: true }
  );
  console.log("✅ Broadcast Notices seeded.");

  // 9. Seed 1-on-1 Conversation & Messages
  if (aarav) {
    const convo = await Conversation.findOneAndUpdate(
      { residentId: aarav._id },
      {
        residentId: aarav._id,
        lastMessageText: "Sure, let me know if you need anything else for Room 101.",
        lastMessageAt: new Date(),
        unreadCountAdmin: 0,
        unreadCountResident: 0,
      },
      { upsert: true, new: true }
    );

    const existingMsg = await Message.findOne({ conversationId: convo._id });
    if (!existingMsg) {
      await Message.create({
        conversationId: convo._id,
        senderId: aarav._id,
        senderRole: "resident",
        text: "Hello Admin, is it okay if my brother visits for a couple of hours this evening?",
        isRead: true,
      });

      await Message.create({
        conversationId: convo._id,
        senderId: adminUser._id,
        senderRole: "admin",
        text: "Hello Aarav! Yes, visitors are welcome in the ground floor lounge and common area until 8:00 PM.",
        isRead: true,
      });

      await Message.create({
        conversationId: convo._id,
        senderId: adminUser._id,
        senderRole: "admin",
        text: "Sure, let me know if you need anything else for Room 101.",
        isRead: true,
      });
    }
  }
  console.log("✅ Private Conversations seeded.");

  console.log("\n✨ Database Seeding Complete!");
  console.log("👑 Admin Login:    admin / admin123 (or admin@rudracoliving.com / admin123)");
  console.log("🏠 Resident Login: 9876543210 / resident123 (Aarav Sharma, Room 101)\n");
}

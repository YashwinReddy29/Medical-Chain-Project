// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedChain {
    struct Record {
        string ipfsHash;
        string fileName;
        address hospital;
        uint256 timestamp;
        bool active;
        string iv;
        string recordType;
    }

    struct Access {
        address user;
        string encryptedKey;
    }

    mapping(address => Record[]) private patientRecords;
    mapping(bytes32 => Access[]) public recordAccess;
    mapping(address => bool) public hospitals;
    mapping(address => string) public hospitalNames;
    mapping(address => address[]) public patientDoctors;

    event HospitalRegistered(address indexed hospital, string name);
    event RecordUploaded(address indexed patient, string hash, string fileName);
    event RecordDeleted(address indexed patient, uint256 index);

    modifier onlyHospital() {
        require(hospitals[msg.sender], "Not a registered hospital");
        _;
    }

    function registerHospital(address hospital, string memory name) public {
        hospitals[hospital] = true;
        hospitalNames[hospital] = name;
        emit HospitalRegistered(hospital, name);
    }

    function uploadRecord(
        address patient,
        string memory ipfsHash,
        string memory fileName,
        string memory iv,
        string memory recordType,
        Access[] memory accessList
    ) public onlyHospital {
        patientRecords[patient].push(Record(ipfsHash, fileName, msg.sender, block.timestamp, true, iv, recordType));
        bytes32 recordId = keccak256(abi.encodePacked(ipfsHash));
        for (uint i = 0; i < accessList.length; i++) {
            recordAccess[recordId].push(accessList[i]);
        }
        emit RecordUploaded(patient, ipfsHash, fileName);
    }

    function getRecords(address patient) public view returns (Record[] memory) {
        return patientRecords[patient];
    }

    function deleteRecord(uint256 index) public {
        patientRecords[msg.sender][index].active = false;
        emit RecordDeleted(msg.sender, index);
    }

    function grantDoctorAccess(address doctor) public {
        patientDoctors[msg.sender].push(doctor);
    }

    function revokeDoctorAccess(address doctor) public {
        address[] storage doctors = patientDoctors[msg.sender];
        for (uint i = 0; i < doctors.length; i++) {
            if (doctors[i] == doctor) {
                doctors[i] = doctors[doctors.length - 1];
                doctors.pop();
                break;
            }
        }
    }

    function getAuthorizedDoctors(address patient) public view returns (address[] memory) {
        return patientDoctors[patient];
    }

    function hasAccess(address patient, address doctor) public view returns (bool) {
        address[] memory doctors = patientDoctors[patient];
        for (uint i = 0; i < doctors.length; i++) {
            if (doctors[i] == doctor) return true;
        }
        return false;
    }
}

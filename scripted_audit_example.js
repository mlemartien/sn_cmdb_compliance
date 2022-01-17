var control = {
    type: 'regexp',	
    field: 'ip_address',
    re: /(\b25[0-5]|\b2[0-4][0-9]|\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/g,
    feedback: 'Wrong format',
    expected: 'A.B.C.D'
};

var certProcessor;

if (gs.getCurrentScopeName().includes("global"))
    certProcessor = new SNC.CertificationProcessing();
else {
    certProcessor = new CertificationProcessing();
}

// API call to retrieve records based on the filter
var gr = certProcessor.getFilterRecords(current.filter);

// Loop over all records defined by the filter
while (gr.next()) {

    var hasPassed = true;
    var auditedRecordId = gr.getUniqueValue();

	if (JSUtil.notNil(gr.getValue(control.field))) {
        var re = new RegExp(control.re);
		if (re.exec(gr.getValue(control.field)) == null) {
            hasPassed = false;
        }
    }

    if (hasPassed) {

        certProcessor.logAuditResultPass(current.getUniqueValue(), auditedRecordId, true);

    } else {

        var followOnTask = null;
        if (current.create_tasks) {

            var userId = null;
            var groupId = null;
            var hasEnoughToCreateTask = true;

            switch (String(current.getValue('assignment_type'))) {

                case 'Specific User':
                userId = current.getValue('user');
                break;

                case 'User Field':
                userId = gr.getValue(current.getValue('assign_to'));
                if (JSUtil.nil(userId)) {
                    if (current.getValue('assign_to_empty') == 'Do Not Create Task') {
                        hasEnoughToCreateTask = false;
                    } else if (current.getValue('assign_to_empty') == 'Create Unassigned Task') {
                        userId = null;
                    } else {
                        userId = current.getValue('user');
                    }
                }
                break;

                case 'Specific Group':
                groupId = current.getValue('group');
                break;

                case 'Group Field':
                groupId = gr.getValue(current.getValue('assign_to_group'));
                if (JSUtil.nil(groupId)) {
                    if (current.getValue('assign_to_empty') == 'Do Not Create Task') {
                        hasEnoughToCreateTask = false;
                    } else if (current.getValue('assign_to_empty') == 'Create Unassigned Task') {
                        groupId = null;
                    } else {
                        groupId = current.getValue('group');
                    }
                }
                break;

            }

            if (hasEnoughToCreateTask) {
                followOnTask = certProcessor.createFollowOnTask(current.getUniqueValue(), auditedRecordId, userId, groupId, current.getValue('task_description'));
            }

        }

		certProcessor.logAuditResultFail(current.getUniqueValue(), auditedRecordId, followOnTask, gr[control.field].getLabel(), control.feedback, control.expected, gr.getValue(control.field), true);

    }

}
